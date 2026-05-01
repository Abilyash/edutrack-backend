package kz.edutrack.application.dto;

import kz.edutrack.domain.model.audit.AuditAction;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogDto(
        UUID id,
        AuditAction action,
        UUID actorId,
        String actorEmail,
        UUID targetId,
        String targetType,
        Map<String, String> metadata,
        Instant occurredAt
) {}
