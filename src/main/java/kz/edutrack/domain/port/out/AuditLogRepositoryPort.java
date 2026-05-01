package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface AuditLogRepositoryPort {
    void save(AuditLog log);
    Page<AuditLog> findAll(Pageable pageable);
    Page<AuditLog> findByActorId(UUID actorId, Pageable pageable);
    Page<AuditLog> findByAction(AuditAction action, Pageable pageable);
    Page<AuditLog> findByDateRange(Instant from, Instant to, Pageable pageable);
}
