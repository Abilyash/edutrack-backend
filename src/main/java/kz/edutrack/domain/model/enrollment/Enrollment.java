package kz.edutrack.domain.model.enrollment;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class Enrollment {
    private final UUID id;
    private final UUID studentId;
    private final UUID courseId;
    private final Instant enrolledAt;
}
