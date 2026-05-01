package kz.edutrack.application.dto;

import java.util.List;
import java.util.UUID;

public record CourseModuleDto(
        UUID id,
        UUID courseId,
        String title,
        int orderIndex,
        List<TopicDto> topics
) {}
