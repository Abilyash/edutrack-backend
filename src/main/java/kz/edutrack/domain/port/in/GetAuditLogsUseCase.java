package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface GetAuditLogsUseCase {
    Page<AuditLog> getAll(Pageable pageable);
    Page<AuditLog> getByActor(UUID actorId, Pageable pageable);
    Page<AuditLog> getByAction(AuditAction action, Pageable pageable);
    Page<AuditLog> getByDateRange(Instant from, Instant to, Pageable pageable);
}
