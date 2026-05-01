package kz.edutrack.infrastructure.persistence.adapter;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.port.out.AuditLogRepositoryPort;
import kz.edutrack.infrastructure.persistence.entity.AuditLogJpaEntity;
import kz.edutrack.infrastructure.persistence.repository.AuditLogJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditLogPersistenceAdapter implements AuditLogRepositoryPort {

    private final AuditLogJpaRepository jpaRepository;

    @Override
    public void save(AuditLog log) {
        jpaRepository.save(toEntity(log));
    }

    @Override
    public Page<AuditLog> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(this::toDomain);
    }

    @Override
    public Page<AuditLog> findByActorId(UUID actorId, Pageable pageable) {
        return jpaRepository.findAllByActorId(actorId, pageable).map(this::toDomain);
    }

    @Override
    public Page<AuditLog> findByAction(AuditAction action, Pageable pageable) {
        return jpaRepository.findAllByAction(action, pageable).map(this::toDomain);
    }

    @Override
    public Page<AuditLog> findByDateRange(Instant from, Instant to, Pageable pageable) {
        return jpaRepository.findAllByOccurredAtBetween(from, to, pageable).map(this::toDomain);
    }

    private AuditLog toDomain(AuditLogJpaEntity e) {
        return AuditLog.builder()
                .id(e.getId())
                .action(e.getAction())
                .actorId(e.getActorId())
                .actorEmail(e.getActorEmail())
                .targetId(e.getTargetId())
                .targetType(e.getTargetType())
                .metadata(e.getMetadata())
                .occurredAt(e.getOccurredAt())
                .build();
    }

    private AuditLogJpaEntity toEntity(AuditLog log) {
        return AuditLogJpaEntity.builder()
                .id(log.getId())
                .action(log.getAction())
                .actorId(log.getActorId())
                .actorEmail(log.getActorEmail())
                .targetId(log.getTargetId())
                .targetType(log.getTargetType())
                .metadata(log.getMetadata())
                .occurredAt(log.getOccurredAt())
                .build();
    }
}
