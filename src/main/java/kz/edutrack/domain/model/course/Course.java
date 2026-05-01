package kz.edutrack.domain.model.course;

import lombok.Builder;
import lombok.Getter;
import lombok.With;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@With
public class Course {
    private final UUID id;
    private final String title;
    private final String description;
    private final UUID teacherId;
    private final boolean published;
    private final List<CourseModule> modules;
    private final Instant createdAt;
}
