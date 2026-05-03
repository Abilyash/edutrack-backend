package kz.edutrack.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTopicRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 10000) String content
) {}
