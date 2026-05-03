package kz.edutrack.domain.model.submission;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class Grade {
    private final UUID id;
    private final UUID submissionId;
    private final UUID teacherId;
    private final int score;
    private final String comment;
    private final Instant gradedAt;
}
