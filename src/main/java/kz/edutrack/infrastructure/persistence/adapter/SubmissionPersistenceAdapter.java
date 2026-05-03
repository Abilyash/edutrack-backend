package kz.edutrack.infrastructure.persistence.adapter;

import kz.edutrack.domain.model.submission.*;
import kz.edutrack.domain.port.out.SubmissionRepositoryPort;
import kz.edutrack.infrastructure.persistence.entity.GradeJpaEntity;
import kz.edutrack.infrastructure.persistence.entity.SubmissionJpaEntity;
import kz.edutrack.infrastructure.persistence.repository.GradeJpaRepository;
import kz.edutrack.infrastructure.persistence.repository.SubmissionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SubmissionPersistenceAdapter implements SubmissionRepositoryPort {

    private final SubmissionJpaRepository submissionRepo;
    private final GradeJpaRepository gradeRepo;

    @Override
    public Submission save(Submission s) {
        return toDomain(submissionRepo.save(toEntity(s)));
    }

    @Override
    public Optional<Submission> findById(UUID id) {
        return submissionRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<Submission> findByTopicId(UUID topicId) {
        return submissionRepo.findByTopicId(topicId).stream().map(this::toDomain).toList();
    }

    @Override
    public List<Submission> findByStudentId(UUID studentId) {
        return submissionRepo.findByStudentId(studentId).stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsByTopicIdAndStudentId(UUID topicId, UUID studentId) {
        return submissionRepo.existsByTopicIdAndStudentId(topicId, studentId);
    }

    @Override
    public Grade saveGrade(Grade g) {
        SubmissionJpaEntity subRef = submissionRepo.getReferenceById(g.getSubmissionId());
        GradeJpaEntity entity = GradeJpaEntity.builder()
                .id(g.getId())
                .submission(subRef)
                .teacherId(g.getTeacherId())
                .score(g.getScore())
                .comment(g.getComment())
                .gradedAt(g.getGradedAt())
                .build();
        return toDomain(gradeRepo.save(entity));
    }

    @Override
    public Submission updateStatus(UUID submissionId, SubmissionStatus status) {
        SubmissionJpaEntity e = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new IllegalStateException("Submission not found: " + submissionId));
        e.setStatus(status);
        return toDomain(submissionRepo.save(e));
    }

    private Submission toDomain(SubmissionJpaEntity e) {
        return Submission.builder()
                .id(e.getId())
                .topicId(e.getTopicId())
                .studentId(e.getStudentId())
                .fileName(e.getFileName())
                .storagePath(e.getStoragePath())
                .publicUrl(e.getPublicUrl())
                .status(e.getStatus())
                .submittedAt(e.getSubmittedAt())
                .grade(e.getGrade() != null ? toDomain(e.getGrade()) : null)
                .build();
    }

    private Grade toDomain(GradeJpaEntity e) {
        return Grade.builder()
                .id(e.getId())
                .submissionId(e.getSubmission().getId())
                .teacherId(e.getTeacherId())
                .score(e.getScore())
                .comment(e.getComment())
                .gradedAt(e.getGradedAt())
                .build();
    }

    private SubmissionJpaEntity toEntity(Submission s) {
        return SubmissionJpaEntity.builder()
                .id(s.getId())
                .topicId(s.getTopicId())
                .studentId(s.getStudentId())
                .fileName(s.getFileName())
                .storagePath(s.getStoragePath())
                .publicUrl(s.getPublicUrl())
                .status(s.getStatus())
                .submittedAt(s.getSubmittedAt())
                .build();
    }
}
