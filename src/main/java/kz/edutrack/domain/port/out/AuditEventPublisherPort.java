package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.audit.AuditLog;

public interface AuditEventPublisherPort {
    void publish(AuditLog event);
}
