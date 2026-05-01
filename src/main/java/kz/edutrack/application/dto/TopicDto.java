package kz.edutrack.application.dto;

import java.util.List;
import java.util.UUID;

public record TopicDto(
        UUID id,
        UUID moduleId,
        String title,
        String content,
        int orderIndex,
        List<MaterialDto> materials
) {}
