package com.grossimarche.dto.mapper;

import com.grossimarche.dto.notification.NotificationResponse;
import com.grossimarche.entity.Notification;
import org.springframework.stereotype.Component;

/** Notification entity → DTO. */
@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(),
                n.getReferenceId(), n.isRead(), n.getCreatedAt());
    }
}
