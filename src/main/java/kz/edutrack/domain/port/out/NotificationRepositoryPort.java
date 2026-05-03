package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.notification.Notification;

import java.util.List;
import java.util.UUID;

public interface NotificationRepositoryPort {
    Notification save(Notification notification);
    List<Notification> findByUserId(UUID userId);
    int countUnreadByUserId(UUID userId);
    void markAllReadByUserId(UUID userId);
}
