package kz.edutrack.infrastructure.kafka.event;

import kz.edutrack.domain.model.audit.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

// Mutable + no-args constructor required for Kafka JsonDeserializer
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEventMessage {
    private UUID eventId;
    private AuditAction action;
    private UUID actorId;
    private String actorEmail;
    private UUID targetId;
    private String targetType;
    private Map<String, String> metadata;
    private Instant occurredAt;
}
