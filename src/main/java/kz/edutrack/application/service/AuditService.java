package kz.edutrack.application.service;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.port.in.GetAuditLogsUseCase;
import kz.edutrack.domain.port.out.AuditLogRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService implements GetAuditLogsUseCase {

    private final AuditLogRepositoryPort auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getByActor(UUID actorId, Pageable pageable) {
        return auditLogRepository.findByActorId(actorId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getByAction(AuditAction action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getByDateRange(Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.findByDateRange(from, to, pageable);
    }
}
