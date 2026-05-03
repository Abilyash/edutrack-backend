package kz.edutrack.domain.model.submission;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class Submission {
    private final UUID id;
    private final UUID topicId;
    private final UUID studentId;
    private final String fileName;
    private final String storagePath;
    private final String publicUrl;
    private final SubmissionStatus status;
    private final Instant submittedAt;
    private final Grade grade;
}
