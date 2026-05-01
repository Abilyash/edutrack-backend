package kz.edutrack.domain.model.course;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class CourseModule {
    private final UUID id;
    private final UUID courseId;
    private final String title;
    private final int orderIndex;
    private final List<Topic> topics;
}
