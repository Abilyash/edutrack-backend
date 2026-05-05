package kz.edutrack.application.dto;

import java.util.UUID;

public record CompletionDto(
        UUID courseId,
        String courseTitle,
        boolean completed,
        int totalTopics,
        int gradedTopics,
        Double averageScore
) {}
