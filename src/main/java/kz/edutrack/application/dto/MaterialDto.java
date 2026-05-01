package kz.edutrack.application.dto;

import kz.edutrack.domain.model.course.MaterialType;

import java.time.Instant;
import java.util.UUID;

public record MaterialDto(
        UUID id,
        UUID topicId,
        String fileName,
        String publicUrl,
        MaterialType type,
        long sizeBytes,
        Instant uploadedAt
) {}
