package com.grossimarche.security;

import com.grossimarche.config.RequestTraceFilter;
import com.grossimarche.dto.common.ApiError;
import com.grossimarche.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Emits the uniform {@link ApiError} JSON (401) when an unauthenticated caller hits a
 * protected endpoint — never an HTML login page. Also used by the JWT filter to reject
 * malformed/expired/denylisted tokens.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        ErrorCode code = ErrorCode.TOKEN_INVALID;
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ApiError body = ApiError.of(code.getStatus().value(), code.name(),
                code.getDefaultMessage(), RequestTraceFilter.currentTraceId());
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
