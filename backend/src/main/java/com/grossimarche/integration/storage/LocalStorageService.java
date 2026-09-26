package com.grossimarche.integration.storage;

import com.grossimarche.config.StorageProperties;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

/**
 * Development storage: writes files under a local directory and returns a URL under the
 * configured public base. A generated UUID name defeats path-traversal and collisions;
 * only a safe extension is taken from the original filename.
 */
@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private final StorageProperties props;

    public LocalStorageService(StorageProperties props) {
        this.props = props;
    }

    @Override
    public String store(byte[] content, String contentType, String originalFilename) {
        String extension = extensionFor(contentType, originalFilename);
        String key = UUID.randomUUID().toString().replace("-", "") + extension;
        try {
            Path dir = Path.of(props.directory());
            Files.createDirectories(dir);
            Files.write(dir.resolve(key), content);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Échec de l'enregistrement du fichier.");
        }
        return props.publicBaseUrl().replaceAll("/$", "") + "/" + key;
    }

    @Override
    public Optional<StoredFile> read(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return Optional.empty();
        }
        String base = props.publicBaseUrl().replaceAll("/$", "");
        int at = publicUrl.indexOf(base);
        String key = (at >= 0 ? publicUrl.substring(at + base.length()) : publicUrl)
                .replaceAll("^/+", "");

        // A key is the generated name and nothing else. Rejecting anything with a slash or a
        // dot segment is what keeps a crafted URL from reading its way out of the directory.
        if (!key.matches("[A-Za-z0-9]+\\.[A-Za-z0-9]{1,5}")) {
            return Optional.empty();
        }
        Path file = Path.of(props.directory()).resolve(key);
        try {
            if (!Files.isReadable(file)) {
                return Optional.empty();
            }
            return Optional.of(new StoredFile(Files.readAllBytes(file), contentTypeFor(key)));
        } catch (IOException e) {
            log.warn("Stored file {} could not be read", key, e);
            return Optional.empty();
        }
    }

    private String contentTypeFor(String key) {
        String ext = key.substring(key.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "avif" -> "image/avif";
            default -> "image/jpeg";
        };
    }

    private String extensionFor(String contentType, String originalFilename) {
        if (originalFilename != null) {
            int dot = originalFilename.lastIndexOf('.');
            if (dot >= 0 && dot < originalFilename.length() - 1) {
                String ext = originalFilename.substring(dot + 1).toLowerCase();
                if (ext.matches("[a-z0-9]{1,5}")) {
                    return "." + ext;
                }
            }
        }
        return switch (contentType == null ? "" : contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/avif" -> ".avif";
            default -> "";
        };
    }
}
