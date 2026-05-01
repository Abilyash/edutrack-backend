package kz.edutrack.infrastructure.persistence.entity;

import jakarta.persistence.*;
import kz.edutrack.domain.model.audit.AuditAction;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_actor_id",   columnList = "actor_id"),
        @Index(name = "idx_audit_action",     columnList = "action"),
        @Index(name = "idx_audit_occurred_at",columnList = "occurred_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogJpaEntity {

    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(name = "target_id")
    private UUID targetId;

    @Column(name = "target_type")
    private String targetType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, String> metadata;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;
}
