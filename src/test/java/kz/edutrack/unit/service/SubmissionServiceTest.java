package kz.edutrack.unit.service;

import kz.edutrack.application.service.SubmissionService;
import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Topic;
import kz.edutrack.domain.model.submission.Grade;
import kz.edutrack.domain.model.submission.Submission;
import kz.edutrack.domain.model.submission.SubmissionStatus;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.domain.port.out.CourseRepositoryPort;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import kz.edutrack.domain.port.out.NotificationRepositoryPort;
import kz.edutrack.domain.port.out.SubmissionRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock SubmissionRepositoryPort submissionRepository;
    @Mock MaterialStoragePort materialStorage;
    @Mock AuditEventPublisherPort auditPublisher;
    @Mock NotificationRepositoryPort notificationRepository;
    @Mock CourseRepositoryPort courseRepository;
    @InjectMocks SubmissionService submissionService;

    private final UUID studentId = UUID.randomUUID();
    private final UUID teacherId = UUID.randomUUID();
    private final UUID topicId   = UUID.randomUUID();
    private final UUID moduleId  = UUID.randomUUID();
    private final UUID courseId  = UUID.randomUUID();

    // ── submit ────────────────────────────────────────────────────────────

    @Test
    void submit_noDeadline_savesSubmissionAndAudits() {
        Topic topic = topicWithDeadline(null);
        when(courseRepository.findTopicById(topicId)).thenReturn(topic);
        when(materialStorage.upload(any(), any(), any())).thenReturn("https://storage/file.pdf");
        when(submissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(courseRepository.findModuleById(moduleId))
                .thenReturn(CourseModule.builder().id(moduleId).courseId(courseId)
                        .title("M").orderIndex(0).topics(List.of()).build());
        when(courseRepository.findCourseById(courseId))
                .thenReturn(Optional.of(courseWithTeacher(teacherId)));

        Submission result = submissionService.submit(
                topicId, "report.pdf", new byte[1024], "application/pdf", studentId);

        assertThat(result.getStudentId()).isEqualTo(studentId);
        assertThat(result.getTopicId()).isEqualTo(topicId);
        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
        assertThat(result.getStoragePath()).contains(topicId.toString());
        verify(auditPublisher).publish(argThat(l -> l.getAction() == AuditAction.SUBMISSION_UPLOADED));
        verify(notificationRepository).save(any());
    }

    @Test
    void submit_beforeDeadline_succeeds() {
        Instant futureDeadline = Instant.now().plusSeconds(3600);
        when(courseRepository.findTopicById(topicId)).thenReturn(topicWithDeadline(futureDeadline));
        when(materialStorage.upload(any(), any(), any())).thenReturn("https://storage/file.pdf");
        when(submissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(courseRepository.findModuleById(moduleId))
                .thenReturn(CourseModule.builder().id(moduleId).courseId(courseId)
                        .title("M").orderIndex(0).topics(List.of()).build());
        when(courseRepository.findCourseById(courseId))
                .thenReturn(Optional.of(courseWithTeacher(teacherId)));

        Submission result = submissionService.submit(
                topicId, "lab.pdf", new byte[512], "application/pdf", studentId);

        assertThat(result).isNotNull();
    }

    @Test
    void submit_afterDeadline_throwsIllegalArgumentException() {
        Instant pastDeadline = Instant.now().minusSeconds(3600);
        when(courseRepository.findTopicById(topicId)).thenReturn(topicWithDeadline(pastDeadline));

        assertThatThrownBy(() ->
                submissionService.submit(topicId, "late.pdf", new byte[256], "application/pdf", studentId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Срок сдачи");

        verify(submissionRepository, never()).save(any());
        verify(materialStorage, never()).upload(any(), any(), any());
    }

    @Test
    void submit_fileNameSanitized_storedWithSafeName() {
        when(courseRepository.findTopicById(topicId)).thenReturn(topicWithDeadline(null));
        when(materialStorage.upload(any(), any(), any())).thenReturn("https://storage/safe.pdf");
        when(submissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(courseRepository.findModuleById(moduleId))
                .thenReturn(CourseModule.builder().id(moduleId).courseId(courseId)
                        .title("M").orderIndex(0).topics(List.of()).build());
        when(courseRepository.findCourseById(courseId))
                .thenReturn(Optional.of(courseWithTeacher(teacherId)));

        submissionService.submit(topicId, "отчёт по лабе #1.pdf", new byte[128], "application/pdf", studentId);

        verify(materialStorage).upload(
                argThat(path -> !path.contains(" ") && !path.contains("#")),
                any(), any());
    }

    // ── grade ─────────────────────────────────────────────────────────────

    @Test
    void grade_validScore_savesGradeAndNotifiesStudent() {
        Submission existing = submissionWith(studentId, topicId);
        when(submissionRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        Submission graded = Submission.builder()
                .id(existing.getId()).topicId(existing.getTopicId())
                .studentId(existing.getStudentId()).fileName(existing.getFileName())
                .storagePath(existing.getStoragePath()).publicUrl(existing.getPublicUrl())
                .status(SubmissionStatus.GRADED).submittedAt(existing.getSubmittedAt())
                .build();
        when(submissionRepository.updateStatus(existing.getId(), SubmissionStatus.GRADED))
                .thenReturn(graded);

        Submission result = submissionService.grade(existing.getId(), 87, "Хорошая работа", teacherId);

        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.GRADED);
        verify(submissionRepository).saveGrade(argThat(g -> g.getScore() == 87));
        verify(auditPublisher).publish(argThat(l -> l.getAction() == AuditAction.GRADE_CREATED));
        verify(notificationRepository).save(argThat(n ->
                n.getUserId().equals(studentId) && n.getMessage().contains("87")));
    }

    @Test
    void grade_submissionNotFound_throwsException() {
        UUID missingId = UUID.randomUUID();
        when(submissionRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> submissionService.grade(missingId, 90, null, teacherId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(missingId.toString());

        verify(submissionRepository, never()).saveGrade(any());
    }

    // ── deleteSubmission ──────────────────────────────────────────────────

    @Test
    void deleteSubmission_byOwner_deletesAndCleansStorage() {
        Submission sub = submissionWith(studentId, topicId);
        when(submissionRepository.findById(sub.getId())).thenReturn(Optional.of(sub));

        submissionService.deleteSubmission(sub.getId(), studentId);

        verify(materialStorage).delete(sub.getStoragePath());
        verify(submissionRepository).deleteById(sub.getId());
    }

    @Test
    void deleteSubmission_byOtherStudent_throwsAccessDeniedException() {
        UUID otherId = UUID.randomUUID();
        Submission sub = submissionWith(studentId, topicId);
        when(submissionRepository.findById(sub.getId())).thenReturn(Optional.of(sub));

        assertThatThrownBy(() -> submissionService.deleteSubmission(sub.getId(), otherId))
                .isInstanceOf(AccessDeniedException.class);

        verify(submissionRepository, never()).deleteById(any());
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private Topic topicWithDeadline(Instant deadline) {
        return Topic.builder()
                .id(topicId)
                .moduleId(moduleId)
                .title("Тема 1")
                .content("Содержание")
                .deadline(deadline)
                .orderIndex(0)
                .materials(List.of())
                .build();
    }

    private Submission submissionWith(UUID student, UUID topic) {
        return Submission.builder()
                .id(UUID.randomUUID())
                .topicId(topic)
                .studentId(student)
                .fileName("file.pdf")
                .storagePath("submissions/" + topic + "/" + student + "/abc_file.pdf")
                .publicUrl("https://storage/file.pdf")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();
    }

    private Course courseWithTeacher(UUID teacher) {
        return Course.builder()
                .id(courseId)
                .title("Курс")
                .description("Описание")
                .teacherId(teacher)
                .published(true)
                .modules(List.of())
                .createdAt(Instant.now())
                .build();
    }
}
