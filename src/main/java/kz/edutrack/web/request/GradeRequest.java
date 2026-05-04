package kz.edutrack.web.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GradeRequest(
        @NotNull @Min(0) @Max(100) Integer score,
        @Size(max = 1000) String comment
) {}
