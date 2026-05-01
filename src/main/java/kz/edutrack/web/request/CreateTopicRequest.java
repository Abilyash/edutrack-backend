package kz.edutrack.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTopicRequest(
        @NotBlank @Size(max = 200) String title,
        String content
) {}
