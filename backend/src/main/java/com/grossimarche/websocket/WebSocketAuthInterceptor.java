package com.grossimarche.websocket;

import com.grossimarche.entity.enums.Role;
import com.grossimarche.security.JwtService;
import com.grossimarche.security.UserPrincipal;
import com.grossimarche.service.OrderService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Authenticates the STOMP {@code CONNECT} frame with the same JWT validation as the REST
 * filter (unauthenticated connections are refused at handshake, never accepted and filtered
 * later) and authorizes {@code SUBSCRIBE} frames: a user may only subscribe to their own
 * order topic, and the admin topic requires ADMIN / STORE_MANAGER.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    /**
     * Everything the back-office listens to - orders, notifications, and whatever is added
     * next. A prefix rather than a list of exact names: the notification topic was added later
     * and fell through the exact match below, which left any signed-in customer free to
     * subscribe to it and read the shop's internal alerts.
     */
    private static final String ADMIN_TOPIC_PREFIX = "/topic/admin/";
    private static final String ORDER_TOPIC_PREFIX = "/topic/orders/";

    private final JwtService jwtService;
    private final OrderService orderService;

    public WebSocketAuthInterceptor(JwtService jwtService, OrderService orderService) {
        this.jwtService = jwtService;
        this.orderService = orderService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // getAccessor, NOT StompHeaderAccessor.wrap: wrap() builds a *copy* of the headers, so
        // the principal set on it during CONNECT was thrown away with that copy. Every later
        // frame then arrived unauthenticated, SUBSCRIBE was refused, the session was torn down
        // and the browser reconnected a few seconds later - forever. Live notifications never
        // reached anyone.
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        StompCommand command = accessor == null ? null : accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            authenticate(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscription(accessor);
        } else if (accessor == null
                && (isStompCommand(message, StompCommand.CONNECT)
                        || isStompCommand(message, StompCommand.SUBSCRIBE))) {
            // No mutable accessor on a frame that must be checked: refuse rather than let it
            // through unauthorised.
            throw new MessagingException("Trame WebSocket illisible.");
        }
        return message;
    }

    private boolean isStompCommand(Message<?> message, StompCommand expected) {
        return expected.equals(StompHeaderAccessor.wrap(message).getCommand());
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new MessagingException("Authentification requise pour la connexion WebSocket.");
        }
        try {
            var jwt = jwtService.parse(header.substring(7).trim());
            UserPrincipal principal = new UserPrincipal(UUID.fromString(jwt.getSubject()),
                    jwt.getSubject(), Role.valueOf(jwt.getClaimAsString(JwtService.ROLE_CLAIM)), true);
            accessor.setUser(new UsernamePasswordAuthenticationToken(principal, null,
                    principal.getAuthorities()));
        } catch (Exception e) {
            throw new MessagingException("Jeton WebSocket invalide.");
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        UserPrincipal principal = principal(accessor);
        String destination = accessor.getDestination();
        if (destination == null) {
            throw new MessagingException("Destination manquante.");
        }
        if (destination.startsWith(ADMIN_TOPIC_PREFIX)) {
            if (principal.getRole() != Role.ADMIN && principal.getRole() != Role.STORE_MANAGER) {
                throw new MessagingException("Accès réservé au back-office.");
            }
        } else if (destination.startsWith(ORDER_TOPIC_PREFIX)) {
            UUID orderId = parseOrderId(destination.substring(ORDER_TOPIC_PREFIX.length()));
            boolean ownsOrder = orderService.userOwnsOrder(orderId, principal.getUserId());
            boolean isStaff = principal.getRole() == Role.ADMIN || principal.getRole() == Role.STORE_MANAGER;
            if (!ownsOrder && !isStaff) {
                throw new MessagingException("Vous ne pouvez pas suivre cette commande.");
            }
        }
    }

    private UserPrincipal principal(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new MessagingException("Connexion non authentifiée.");
    }

    private UUID parseOrderId(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            throw new MessagingException("Identifiant de commande invalide.");
        }
    }
}
