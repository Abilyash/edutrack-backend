package kz.edutrack.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateTopicRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 10000) String content,
        Instant deadline
) {}
