package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.submission.Submission;

import java.util.List;
import java.util.UUID;

public interface GradeSubmissionUseCase {
    List<Submission> getSubmissionsByTopic(UUID topicId);
    List<Submission> getMySubmissions(UUID studentId);
    Submission grade(UUID submissionId, int score, String comment, UUID teacherId);
}
