package kz.edutrack.web.controller;

import kz.edutrack.domain.model.notification.Notification;
import kz.edutrack.domain.port.out.NotificationRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepositoryPort notificationRepo;

    @GetMapping
    public List<Notification> getMyNotifications(@AuthenticationPrincipal Jwt jwt) {
        return notificationRepo.findByUserId(UUID.fromString(jwt.getSubject()));
    }

    @GetMapping("/unread-count")
    public Map<String, Integer> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("count", notificationRepo.countUnreadByUserId(UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/read-all")
    @Transactional
    public void markAllRead(@AuthenticationPrincipal Jwt jwt) {
        notificationRepo.markAllReadByUserId(UUID.fromString(jwt.getSubject()));
    }
}
