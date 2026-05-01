package kz.edutrack.unit.service;

import kz.edutrack.application.service.CourseService;
import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.course.*;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.domain.port.out.CourseRepositoryPort;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock CourseRepositoryPort courseRepository;
    @Mock MaterialStoragePort materialStorage;
    @Mock AuditEventPublisherPort auditPublisher;
    @InjectMocks CourseService courseService;

    private final UUID teacherId = UUID.randomUUID();

    @Test
    void createCourse_success_returnsSavedCourseAndAudits() {
        when(courseRepository.saveCourse(any())).thenAnswer(inv -> inv.getArgument(0));

        Course result = courseService.createCourse("Java Basics", "Learn Java", teacherId);

        assertThat(result.getTitle()).isEqualTo("Java Basics");
        assertThat(result.getTeacherId()).isEqualTo(teacherId);
        assertThat(result.isPublished()).isFalse();
        assertThat(result.getId()).isNotNull();
        verify(auditPublisher).publish(argThat(l -> l.getAction() == AuditAction.COURSE_CREATED));
    }

    @Test
    void getCourseById_notFound_throwsException() {
        UUID id = UUID.randomUUID();
        when(courseRepository.findCourseById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getCourseById(id))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void addModule_courseNotFound_throwsException() {
        UUID courseId = UUID.randomUUID();
        when(courseRepository.findCourseById(courseId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.addModule(courseId, "Module 1", teacherId))
                .isInstanceOf(IllegalStateException.class);
        verify(courseRepository, never()).saveModule(any());
    }

    @Test
    void uploadMaterial_pdfFile_setsCorrectTypeAndAudits() {
        UUID topicId = UUID.randomUUID();
        byte[] content = new byte[2048];
        when(materialStorage.upload(any(), any(), any())).thenReturn("https://storage/test.pdf");
        when(courseRepository.saveMaterial(any())).thenAnswer(inv -> inv.getArgument(0));

        Material result = courseService.uploadMaterial(
                topicId, "lecture.pdf", content, "application/pdf", teacherId);

        assertThat(result.getType()).isEqualTo(MaterialType.PDF);
        assertThat(result.getPublicUrl()).isEqualTo("https://storage/test.pdf");
        assertThat(result.getSizeBytes()).isEqualTo(2048);
        assertThat(result.getStoragePath()).contains(topicId.toString());
        verify(auditPublisher).publish(argThat(l -> l.getAction() == AuditAction.MATERIAL_UPLOADED));
    }

    @Test
    void uploadMaterial_zipFile_setsCodeArchiveType() {
        UUID topicId = UUID.randomUUID();
        when(materialStorage.upload(any(), any(), any())).thenReturn("https://storage/lab.zip");
        when(courseRepository.saveMaterial(any())).thenAnswer(inv -> inv.getArgument(0));

        Material result = courseService.uploadMaterial(
                topicId, "lab1.zip", new byte[512], "application/zip", teacherId);

        assertThat(result.getType()).isEqualTo(MaterialType.CODE_ARCHIVE);
    }
}
