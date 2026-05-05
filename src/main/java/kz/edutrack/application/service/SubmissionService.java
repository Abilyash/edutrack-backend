package kz.edutrack.application.service;

import kz.edutrack.application.dto.CompletionDto;
import kz.edutrack.application.dto.GradeDto;
import kz.edutrack.application.dto.SubmissionDto;
import kz.edutrack.application.mapper.SubmissionMapper;
import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.model.submission.*;
import kz.edutrack.domain.port.in.GradeSubmissionUseCase;
import kz.edutrack.domain.port.in.SubmitWorkUseCase;
import kz.edutrack.domain.model.notification.Notification;
import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Topic;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.domain.port.out.CourseRepositoryPort;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import kz.edutrack.domain.port.out.NotificationRepositoryPort;
import kz.edutrack.domain.port.out.SubmissionRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubmissionService implements SubmitWorkUseCase, GradeSubmissionUseCase {

    private final SubmissionRepositoryPort submissionRepository;
    private final MaterialStoragePort materialStorage;
    private final AuditEventPublisherPort auditPublisher;
    private final NotificationRepositoryPort notificationRepository;
    private final CourseRepositoryPort courseRepository;
    private final SubmissionMapper submissionMapper;

    @Override
    @Transactional
    public Submission submit(UUID topicId, String fileName, byte[] content, String contentType, UUID studentId) {
        Topic topic = courseRepository.findTopicById(topicId);
        if (topic.getDeadline() != null && Instant.now().isAfter(topic.getDeadline())) {
            throw new IllegalArgumentException("Срок сдачи по теме «" + topic.getTitle() + "» истёк");
        }
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

        try {
            CourseModule module = courseRepository.findModuleById(topic.getModuleId());
            Course course = courseRepository.findCourseById(module.getCourseId()).orElseThrow();
            notificationRepository.save(Notification.builder()
                    .id(UUID.randomUUID())
                    .userId(course.getTeacherId())
                    .message("Студент сдал работу по теме «" + topic.getTitle() + "»: " + fileName)
                    .read(false)
                    .createdAt(Instant.now())
                    .build());
        } catch (Exception ignored) {}

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

    @Transactional(readOnly = true)
    public CompletionDto getCourseCompletion(UUID courseId, UUID studentId) {
        Course course = courseRepository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));

        List<UUID> topicIds = course.getModules().stream()
                .flatMap(m -> m.getTopics().stream())
                .map(Topic::getId)
                .toList();

        int total = topicIds.size();
        if (total == 0) {
            return new CompletionDto(courseId, course.getTitle(), false, 0, 0, null);
        }

        List<Submission> submissions = submissionRepository.findByStudentId(studentId);

        Map<UUID, Integer> bestScorePerTopic = new HashMap<>();
        for (Submission s : submissions) {
            if (s.getGrade() != null && topicIds.contains(s.getTopicId())) {
                bestScorePerTopic.merge(s.getTopicId(), s.getGrade().getScore(), Math::max);
            }
        }

        int graded = bestScorePerTopic.size();
        boolean completed = graded == total;
        Double avg = bestScorePerTopic.isEmpty() ? null
                : bestScorePerTopic.values().stream().mapToInt(v -> v).average().orElse(0);

        return new CompletionDto(courseId, course.getTitle(), completed, total, graded, avg);
    }

    @Transactional(readOnly = true)
    public List<SubmissionDto> getMySubmissionsEnriched(UUID studentId) {
        return submissionRepository.findByStudentId(studentId).stream()
            .map(s -> {
                SubmissionDto base = submissionMapper.toDto(s);
                String topicTitle = null;
                java.time.Instant deadline = null;
                try {
                    Topic topic = courseRepository.findTopicById(s.getTopicId());
                    topicTitle = topic.getTitle();
                    deadline = topic.getDeadline();
                } catch (Exception ignored) {}
                return new SubmissionDto(base.id(), base.topicId(), base.studentId(),
                    base.fileName(), base.publicUrl(), base.status(),
                    base.submittedAt(), base.grade(), topicTitle, deadline);
            })
            .toList();
    }

    @Override
    @Transactional
    public void deleteSubmission(UUID submissionId, UUID studentId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalStateException("Submission not found: " + submissionId));
        if (!submission.getStudentId().equals(studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not your submission");
        }
        try { materialStorage.delete(submission.getStoragePath()); } catch (Exception ignored) {}
        submissionRepository.deleteById(submissionId);
    }

    @Override
    @Transactional
    public Submission grade(UUID submissionId, int score, String comment, UUID teacherId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalStateException("Submission not found: " + submissionId));

        Grade existing = submission.getGrade();
        if (existing != null) {
            long daysSince = ChronoUnit.DAYS.between(existing.getGradedAt(), Instant.now());
            if (daysSince >= 3) {
                throw new IllegalArgumentException(
                        "Изменение оценки недоступно спустя 3 дня после выставления");
            }
            submissionRepository.updateGrade(Grade.builder()
                    .id(existing.getId())
                    .submissionId(submissionId)
                    .teacherId(teacherId)
                    .score(score)
                    .comment(comment)
                    .gradedAt(Instant.now())
                    .build());
        } else {
            submissionRepository.saveGrade(Grade.builder()
                    .id(UUID.randomUUID())
                    .submissionId(submissionId)
                    .teacherId(teacherId)
                    .score(score)
                    .comment(comment)
                    .gradedAt(Instant.now())
                    .build());
        }

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.GRADE_CREATED)
                .actorId(teacherId)
                .targetId(submissionId)
                .targetType("SUBMISSION")
                .metadata(Map.of("score", String.valueOf(score)))
                .occurredAt(Instant.now())
                .build());

        notificationRepository.save(Notification.builder()
                .id(UUID.randomUUID())
                .userId(submission.getStudentId())
                .message("Ваша работа «" + submission.getFileName() + "» проверена. Оценка: " + score + "/100")
                .read(false)
                .createdAt(Instant.now())
                .build());

        Submission graded = submissionRepository.updateStatus(submissionId, SubmissionStatus.GRADED);

        // Уведомление преподавателю, если студент завершил весь курс
        if (existing == null) {
            try {
                Topic topic = courseRepository.findTopicById(submission.getTopicId());
                CourseModule module = courseRepository.findModuleById(topic.getModuleId());
                Course course = courseRepository.findCourseById(module.getCourseId()).orElseThrow();
                CompletionDto completion = getCourseCompletion(course.getId(), submission.getStudentId());
                if (completion.completed()) {
                    int avg = completion.averageScore() != null ? (int) Math.round(completion.averageScore()) : 0;
                    notificationRepository.save(Notification.builder()
                            .id(UUID.randomUUID())
                            .userId(course.getTeacherId())
                            .message("Студент завершил курс «" + course.getTitle() + "» — все темы проверены. Средний балл: " + avg + "/100")
                            .read(false)
                            .createdAt(Instant.now())
                            .build());
                }
            } catch (Exception ignored) {}
        }

        return graded;
    }
}
