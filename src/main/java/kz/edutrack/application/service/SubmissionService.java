package kz.edutrack.application.service;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.model.submission.*;
import kz.edutrack.domain.port.in.GradeSubmissionUseCase;
import kz.edutrack.domain.port.in.SubmitWorkUseCase;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import kz.edutrack.domain.port.out.SubmissionRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubmissionService implements SubmitWorkUseCase, GradeSubmissionUseCase {

    private final SubmissionRepositoryPort submissionRepository;
    private final MaterialStoragePort materialStorage;
    private final AuditEventPublisherPort auditPublisher;

    @Override
    @Transactional
    public Submission submit(UUID topicId, String fileName, byte[] content, String contentType, UUID studentId) {
        String safeName = UUID.randomUUID().toString().substring(0, 8)
                + "_" + fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storagePath = "submissions/" + topicId + "/" + studentId + "/" + safeName;
        String publicUrl = materialStorage.upload(storagePath, content, contentType);

        Submission submission = Submission.builder()
                .id(UUID.randomUUID())
                .topicId(topicId)
                .studentId(studentId)
                .fileName(fileName)
                .storagePath(storagePath)
                .publicUrl(publicUrl)
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();
        Submission saved = submissionRepository.save(submission);

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.SUBMISSION_UPLOADED)
                .actorId(studentId)
                .targetId(saved.getId())
                .targetType("SUBMISSION")
                .metadata(Map.of("topicId", topicId.toString(), "fileName", fileName))
                .occurredAt(Instant.now())
                .build());

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Submission> getSubmissionsByTopic(UUID topicId) {
        return submissionRepository.findByTopicId(topicId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Submission> getMySubmissions(UUID studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    @Override
    @Transactional
    public Submission grade(UUID submissionId, int score, String comment, UUID teacherId) {
        Grade grade = Grade.builder()
                .id(UUID.randomUUID())
                .submissionId(submissionId)
                .teacherId(teacherId)
                .score(score)
                .comment(comment)
                .gradedAt(Instant.now())
                .build();
        submissionRepository.saveGrade(grade);

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.GRADE_CREATED)
                .actorId(teacherId)
                .targetId(submissionId)
                .targetType("SUBMISSION")
                .metadata(Map.of("score", String.valueOf(score)))
                .occurredAt(Instant.now())
                .build());

        return submissionRepository.updateStatus(submissionId, SubmissionStatus.GRADED);
    }
}
