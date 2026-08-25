package com.grossimarche.security;

import com.grossimarche.entity.enums.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Authenticates requests bearing an {@code Authorization: Bearer <jwt>} header. Registered
 * before {@code UsernamePasswordAuthenticationFilter}. It validates the token (signature,
 * expiry, issuer via {@link JwtService}), rejects denylisted jtis, and populates the
 * SecurityContext from the token claims - no DB hit on the hot path.
 *
 * <p>A missing header is left to the authorization rules (public endpoints stay open). A
 * malformed / expired / revoked token yields a clean 401 in the {@code ApiError} shape via
 * {@link RestAuthenticationEntryPoint} - never a 500 and never HTML.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final TokenDenylistService denylist;
    private final RestAuthenticationEntryPoint entryPoint;

    public JwtAuthenticationFilter(JwtService jwtService, TokenDenylistService denylist,
                                   RestAuthenticationEntryPoint entryPoint) {
        this.jwtService = jwtService;
        this.denylist = denylist;
        this.entryPoint = entryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();
        try {
            Jwt jwt = jwtService.parse(token);
            String jti = jwt.getId();
            if (jti != null && denylist.isDenylisted(jti)) {
                reject(request, response, "Jeton révoqué.");
                return;
            }
            UserPrincipal principal = new UserPrincipal(
                    UUID.fromString(jwt.getSubject()),
                    jwt.getSubject(),
                    Role.valueOf(jwt.getClaimAsString(JwtService.ROLE_CLAIM)),
                    true);
            var authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            reject(request, response, "Jeton invalide.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void reject(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException, ServletException {
        entryPoint.commence(request, response, new InsufficientAuthenticationException(message));
    }
}
