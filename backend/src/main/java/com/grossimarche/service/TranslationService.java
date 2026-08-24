package com.grossimarche.service;

import com.grossimarche.config.TranslationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Machine translation via a self-hosted LibreTranslate instance, with every result cached in
 * Redis (translations are stable, so each unique string is translated once). Best-effort: if
 * translation is disabled, the target equals the source, or LibreTranslate is unreachable
 * (e.g. still downloading models), the original text is returned so the store never breaks.
 */
@Service
public class TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationService.class);
    private static final Duration CACHE_TTL = Duration.ofDays(30);
    private static final int MAX_CHARS = 5000; // guard against oversized inputs

    /**
     * Scripts we can verify an answer against. LibreTranslate has no direct fr->ar model and
     * pivots through English; when the second leg does not run, it returns the English
     * intermediate. That is not a failure it reports — the text simply comes back in the wrong
     * language — so for languages with their own script we check the output actually uses it.
     */
    private static final Map<String, Character.UnicodeScript> TARGET_SCRIPT = Map.of(
            "ar", Character.UnicodeScript.ARABIC,
            "he", Character.UnicodeScript.HEBREW,
            "el", Character.UnicodeScript.GREEK,
            "ru", Character.UnicodeScript.CYRILLIC,
            "zh", Character.UnicodeScript.HAN,
            "ko", Character.UnicodeScript.HANGUL);

    private final TranslationProperties props;
    private final StringRedisTemplate redis;
    private final RestClient client;

    public TranslationService(TranslationProperties props, StringRedisTemplate redis) {
        this.props = props;
        this.redis = redis;
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        // Fail fast to connect, but allow a long read: batch pivot translation is slow.
        rf.setConnectTimeout((int) Math.min(3000, props.timeoutMs()));
        rf.setReadTimeout((int) props.timeoutMs());
        this.client = RestClient.builder().baseUrl(props.url()).requestFactory(rf).build();
    }

    public String translate(String text, String source, String target) {
        List<String> out = translateBatch(List.of(text == null ? "" : text), source, target);
        return out.isEmpty() ? text : out.get(0);
    }

    /** Translate a batch, preserving order; cache hits are served from Redis, misses in one call. */
    public List<String> translateBatch(List<String> texts, String source, String target) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        if (!props.enabled() || target == null || target.isBlank()
                || target.equalsIgnoreCase(source)) {
            return texts;
        }
        String[] result = new String[texts.size()];
        List<Integer> missIdx = new ArrayList<>();
        List<String> missText = new ArrayList<>();

        for (int i = 0; i < texts.size(); i++) {
            String t = texts.get(i);
            if (t == null || t.isBlank() || t.length() > MAX_CHARS) {
                result[i] = t;
                continue;
            }
            String cached = safeGet(cacheKey(source, target, t));
            if (cached != null) {
                result[i] = cached;
            } else {
                missIdx.add(i);
                missText.add(t);
            }
        }

        if (!missText.isEmpty()) {
            // null => the call failed; we return the source text but must NOT cache it, so the
            // string is retried later (e.g. once LibreTranslate finishes loading its models).
            List<String> translated = callLibre(missText, source, target);
            boolean ok = translated != null;
            for (int j = 0; j < missIdx.size(); j++) {
                int idx = missIdx.get(j);
                String src = missText.get(j);
                String tr = (ok && j < translated.size()) ? translated.get(j) : src;
                // Only cache genuine translations. An identical output usually means the
                // target model wasn't reached; an output in the wrong script means the pivot
                // stopped at English. Neither is frozen in the cache, so both are retried
                // later — once the model finishes loading, the answer corrects itself.
                boolean genuine = ok && tr != null && !tr.equals(src) && inTargetScript(tr, target);
                result[idx] = genuine ? tr : src;
                if (genuine) {
                    safeSet(cacheKey(source, target, src), tr);
                }
            }
        }
        return Arrays.asList(result);
    }

    @SuppressWarnings("unchecked")
    private List<String> callLibre(List<String> q, String source, String target) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("q", q);
            body.put("source", (source == null || source.isBlank()) ? "auto" : source);
            body.put("target", target);
            body.put("format", "text");
            if (props.apiKey() != null && !props.apiKey().isBlank()) {
                body.put("api_key", props.apiKey());
            }
            Map<String, Object> resp = client.post().uri("/translate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            Object tt = resp == null ? null : resp.get("translatedText");
            if (tt instanceof List<?> list) {
                List<String> out = new ArrayList<>(list.size());
                for (Object o : list) {
                    out.add(String.valueOf(o));
                }
                return out;
            }
            if (tt instanceof String s) {
                return List.of(s);
            }
            return null;
        } catch (Exception e) {
            log.warn("LibreTranslate unavailable ({}); returning source text.", e.getMessage());
            return null;
        }
    }

    /**
     * Whether {@code text} is written in the target language's script. Languages that share
     * the Latin alphabet cannot be told apart this way, so they always pass.
     */
    private boolean inTargetScript(String text, String target) {
        if (target == null) {
            return true;
        }
        Character.UnicodeScript expected =
                TARGET_SCRIPT.get(target.toLowerCase(Locale.ROOT).split("[-_]")[0]);
        if (expected == null) {
            return true;
        }
        return text.codePoints()
                .filter(Character::isLetter)
                .anyMatch(cp -> Character.UnicodeScript.of(cp) == expected);
    }

    private String cacheKey(String source, String target, String text) {
        String s = (source == null || source.isBlank()) ? "auto" : source;
        String hash = DigestUtils.md5DigestAsHex(text.getBytes(StandardCharsets.UTF_8));
        return "tr:" + s + ":" + target + ":" + hash;
    }

    private String safeGet(String key) {
        try {
            return redis.opsForValue().get(key);
        } catch (Exception e) {
            return null;
        }
    }

    private void safeSet(String key, String value) {
        try {
            redis.opsForValue().set(key, value, CACHE_TTL);
        } catch (Exception ignore) {
            // cache is an optimisation; never fail a translation because Redis hiccuped
        }
    }
}
