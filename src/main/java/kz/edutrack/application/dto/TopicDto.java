package kz.edutrack.application.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TopicDto(
        UUID id,
        UUID moduleId,
        String title,
        String content,
        int orderIndex,
        Instant deadline,
        List<MaterialDto> materials
) {}
