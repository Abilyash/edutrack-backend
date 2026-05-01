package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.infrastructure.persistence.entity.AuditLogJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface AuditLogJpaRepository extends JpaRepository<AuditLogJpaEntity, UUID> {
    Page<AuditLogJpaEntity> findAllByActorId(UUID actorId, Pageable pageable);
    Page<AuditLogJpaEntity> findAllByAction(AuditAction action, Pageable pageable);
    Page<AuditLogJpaEntity> findAllByOccurredAtBetween(Instant from, Instant to, Pageable pageable);
}
