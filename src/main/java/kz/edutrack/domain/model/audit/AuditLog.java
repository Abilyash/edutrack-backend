package kz.edutrack.domain.model.audit;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class AuditLog {
    private final UUID id;
    private final AuditAction action;
    private final UUID actorId;
    private final String actorEmail;
    private final UUID targetId;
    private final String targetType;
    private final Map<String, String> metadata;
    private final Instant occurredAt;
}
