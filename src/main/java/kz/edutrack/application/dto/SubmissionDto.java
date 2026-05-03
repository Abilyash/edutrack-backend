package kz.edutrack.application.dto;

import java.time.Instant;
import java.util.UUID;

public record SubmissionDto(
        UUID id,
        UUID topicId,
        UUID studentId,
        String fileName,
        String publicUrl,
        String status,
        Instant submittedAt,
        GradeDto grade
) {}
