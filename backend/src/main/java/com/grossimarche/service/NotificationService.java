package com.grossimarche.service;

import com.grossimarche.dto.mapper.NotificationMapper;
import com.grossimarche.dto.notification.NotificationResponse;
import com.grossimarche.entity.Notification;
import com.grossimarche.entity.enums.NotificationType;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * The back-office notification feed. Reads and read/delete actions are open to STORE_MANAGER
 * and ADMIN. {@link #record} is called internally by event listeners (no user in context) to
 * persist a notification and broadcast it live to {@code /topic/admin/notifications}.
 */
@Service
public class NotificationService {

    /** STOMP topic every signed-in staff client subscribes to. */
    public static final String TOPIC = "/topic/admin/notifications";

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationMapper notificationMapper,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(Pageable pageable) {
        return notificationRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(notificationMapper::toResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public long unreadCount() {
        return notificationRepository.countByReadFalse();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public NotificationResponse markRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        notification.setRead(true);
        return notificationMapper.toResponse(notification);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void markAllRead() {
        notificationRepository.markAllRead();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void delete(UUID id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification", id);
        }
        notificationRepository.deleteById(id);
    }

    /**
     * Persist a notification and push it to staff subscribers. Intended for internal callers
     * (event listeners), so it carries no authorization annotation — never expose it to a
     * request-driven path.
     */
    @Transactional
    public void record(NotificationType type, String title, String message, UUID referenceId) {
        Notification notification = notificationRepository.save(Notification.builder()
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .read(false)
                .build());
        messagingTemplate.convertAndSend(TOPIC, notificationMapper.toResponse(notification));
    }
}
