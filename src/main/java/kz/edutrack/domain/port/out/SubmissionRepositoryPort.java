package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.submission.Grade;
import kz.edutrack.domain.model.submission.Submission;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepositoryPort {
    Submission save(Submission submission);
    Optional<Submission> findById(UUID id);
    List<Submission> findByTopicId(UUID topicId);
    List<Submission> findByStudentId(UUID studentId);
    boolean existsByTopicIdAndStudentId(UUID topicId, UUID studentId);
    Grade saveGrade(Grade grade);
    Submission updateStatus(UUID submissionId, kz.edutrack.domain.model.submission.SubmissionStatus status);
}
