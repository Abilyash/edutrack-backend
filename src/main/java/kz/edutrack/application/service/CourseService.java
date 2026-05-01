package kz.edutrack.application.service;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.model.course.*;
import kz.edutrack.domain.port.in.*;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.domain.port.out.CourseRepositoryPort;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseService implements
        CreateCourseUseCase,
        GetCourseUseCase,
        AddModuleUseCase,
        UploadMaterialUseCase {

    private final CourseRepositoryPort courseRepository;
    private final MaterialStoragePort materialStorage;
    private final AuditEventPublisherPort auditPublisher;

    // ── CreateCourseUseCase ────────────────────────────────────────────────

    @Override
    @Transactional
    public Course createCourse(String title, String description, UUID teacherId) {
        Course course = Course.builder()
                .id(UUID.randomUUID())
                .title(title)
                .description(description)
                .teacherId(teacherId)
                .published(false)
                .modules(List.of())
                .createdAt(Instant.now())
                .build();
        Course saved = courseRepository.saveCourse(course);

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.COURSE_CREATED)
                .actorId(teacherId)
                .targetId(saved.getId())
                .targetType("COURSE")
                .metadata(Map.of("title", title))
                .occurredAt(Instant.now())
                .build());

        return saved;
    }

    // ── GetCourseUseCase ───────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Course getCourseById(UUID id) {
        return courseRepository.findCourseById(id)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        return courseRepository.findAllCourses();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> getCoursesByTeacher(UUID teacherId) {
        return courseRepository.findCoursesByTeacherId(teacherId);
    }

    // ── AddModuleUseCase ───────────────────────────────────────────────────

    @Override
    @Transactional
    public CourseModule addModule(UUID courseId, String title, UUID actorId) {
        courseRepository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));

        int order = courseRepository.countModulesByCourseId(courseId);
        CourseModule module = CourseModule.builder()
                .id(UUID.randomUUID())
                .courseId(courseId)
                .title(title)
                .orderIndex(order)
                .topics(List.of())
                .build();
        CourseModule saved = courseRepository.saveModule(module);

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.MODULE_ADDED)
                .actorId(actorId)
                .targetId(saved.getId())
                .targetType("MODULE")
                .metadata(Map.of("courseId", courseId.toString(), "title", title))
                .occurredAt(Instant.now())
                .build());

        return saved;
    }

    @Override
    @Transactional
    public Topic addTopic(UUID moduleId, String title, String content, UUID actorId) {
        int order = courseRepository.countTopicsByModuleId(moduleId);
        Topic topic = Topic.builder()
                .id(UUID.randomUUID())
                .moduleId(moduleId)
                .title(title)
                .content(content)
                .orderIndex(order)
                .materials(List.of())
                .build();
        Topic saved = courseRepository.saveTopic(topic);

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.TOPIC_ADDED)
                .actorId(actorId)
                .targetId(saved.getId())
                .targetType("TOPIC")
                .metadata(Map.of("moduleId", moduleId.toString(), "title", title))
                .occurredAt(Instant.now())
                .build());

        return saved;
    }

    // ── UploadMaterialUseCase ──────────────────────────────────────────────

    @Override
    @Transactional
    public Material uploadMaterial(UUID topicId, String fileName, byte[] content,
                                   String contentType, UUID actorId) {
        String storagePath = "topics/" + topicId + "/" + fileName;
        String publicUrl = materialStorage.upload(storagePath, content, contentType);

        Material material = Material.builder()
                .id(UUID.randomUUID())
                .topicId(topicId)
                .fileName(fileName)
                .storagePath(storagePath)
                .publicUrl(publicUrl)
                .type(MaterialType.fromContentType(contentType))
                .sizeBytes(content.length)
                .uploadedAt(Instant.now())
                .build();
        Material saved = courseRepository.saveMaterial(material);

        auditPublisher.publish(AuditLog.builder()
                .id(UUID.randomUUID())
                .action(AuditAction.MATERIAL_UPLOADED)
                .actorId(actorId)
                .targetId(saved.getId())
                .targetType("MATERIAL")
                .metadata(Map.of("topicId", topicId.toString(), "fileName", fileName,
                                 "sizeBytes", String.valueOf(content.length)))
                .occurredAt(Instant.now())
                .build());

        return saved;
    }
}
