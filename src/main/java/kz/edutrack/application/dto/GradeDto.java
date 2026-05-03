package kz.edutrack.application.dto;

import java.time.Instant;
import java.util.UUID;

public record GradeDto(
        UUID id,
        UUID submissionId,
        UUID teacherId,
        int score,
        String comment,
        Instant gradedAt
) {}
