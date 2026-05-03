package kz.edutrack.infrastructure.persistence.adapter;

import kz.edutrack.domain.model.notification.Notification;
import kz.edutrack.domain.port.out.NotificationRepositoryPort;
import kz.edutrack.infrastructure.persistence.entity.NotificationJpaEntity;
import kz.edutrack.infrastructure.persistence.repository.NotificationJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements NotificationRepositoryPort {

    private final NotificationJpaRepository repo;

    @Override
    public Notification save(Notification n) {
        return toDomain(repo.save(toEntity(n)));
    }

    @Override
    public List<Notification> findByUserId(UUID userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDomain).toList();
    }

    @Override
    public int countUnreadByUserId(UUID userId) {
        return repo.countByUserIdAndReadFalse(userId);
    }

    @Override
    public void markAllReadByUserId(UUID userId) {
        repo.markAllReadByUserId(userId);
    }

    private Notification toDomain(NotificationJpaEntity e) {
        return Notification.builder()
                .id(e.getId())
                .userId(e.getUserId())
                .message(e.getMessage())
                .read(e.isRead())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private NotificationJpaEntity toEntity(Notification n) {
        return NotificationJpaEntity.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
