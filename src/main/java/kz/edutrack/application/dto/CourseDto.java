package kz.edutrack.application.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CourseDto(
        UUID id,
        String title,
        String description,
        UUID teacherId,
        boolean published,
        List<CourseModuleDto> modules,
        Instant createdAt
) {}
