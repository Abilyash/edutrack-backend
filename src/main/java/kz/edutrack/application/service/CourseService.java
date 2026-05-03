package kz.edutrack.application.service;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.model.course.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public List<Course> getPublishedCourses() {
        return courseRepository.findAllPublishedCourses();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> getCoursesByTeacher(UUID teacherId) {
        return courseRepository.findCoursesByTeacherId(teacherId);
    }

    @Override
    @Transactional
    public void deleteCourse(UUID courseId, UUID actorId) {
        Course course = courseRepository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));
        requireOwner(course, actorId);
        courseRepository.deleteCourseById(courseId);
    }

    @Override
    @Transactional
    public void deleteMaterial(UUID materialId, UUID actorId) {
        Material material = courseRepository.findMaterialById(materialId)
                .orElseThrow(() -> new IllegalStateException("Material not found: " + materialId));
        Topic topic = courseRepository.findTopicById(material.getTopicId());
        CourseModule module = courseRepository.findModuleById(topic.getModuleId());
        Course course = courseRepository.findCourseById(module.getCourseId())
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        requireOwner(course, actorId);
        try { materialStorage.delete(material.getStoragePath()); } catch (Exception ignored) {}
        courseRepository.deleteMaterialById(materialId);
    }

    @Override
    @Transactional
    public Course updateCourse(UUID courseId, String title, String description, UUID actorId) {
        Course course = courseRepository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));
        requireOwner(course, actorId);
        return courseRepository.updateCourseDetails(courseId, title, description);
    }

    @Override
    @Transactional
    public Course togglePublish(UUID courseId, boolean published, UUID actorId) {
        Course course = courseRepository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));
        requireOwner(course, actorId);
        return courseRepository.updatePublished(courseId, published);
    }

    // ── AddModuleUseCase ───────────────────────────────────────────────────

    private void requireOwner(Course course, UUID actorId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !course.getTeacherId().equals(actorId)) {
            throw new AccessDeniedException("Only the course owner can modify it");
        }
    }

    @Override
    @Transactional
    public CourseModule addModule(UUID courseId, String title, UUID actorId) {
        Course course = courseRepository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));
        requireOwner(course, actorId);

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
    public CourseModule updateModule(UUID moduleId, String title, UUID actorId) {
        CourseModule module = courseRepository.findModuleById(moduleId);
        Course course = courseRepository.findCourseById(module.getCourseId())
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        requireOwner(course, actorId);
        return courseRepository.updateModuleTitle(moduleId, title);
    }

    @Override
    @Transactional
    public Topic addTopic(UUID moduleId, String title, String content, java.time.Instant deadline, UUID actorId) {
        CourseModule module = courseRepository.findModuleById(moduleId);
        Course course = courseRepository.findCourseById(module.getCourseId())
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        requireOwner(course, actorId);
        int order = courseRepository.countTopicsByModuleId(moduleId);
        Topic topic = Topic.builder()
                .id(UUID.randomUUID())
                .moduleId(moduleId)
                .title(title)
                .content(content)
                .deadline(deadline)
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

    @Override
    @Transactional
    public Topic updateTopic(UUID topicId, String title, String content, java.time.Instant deadline, UUID actorId) {
        Topic topic = courseRepository.findTopicById(topicId);
        CourseModule module = courseRepository.findModuleById(topic.getModuleId());
        Course course = courseRepository.findCourseById(module.getCourseId())
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        requireOwner(course, actorId);
        return courseRepository.updateTopicDetails(topicId, title, content, deadline);
    }

    // ── UploadMaterialUseCase ──────────────────────────────────────────────

    @Override
    @Transactional
    public Material uploadMaterial(UUID topicId, String fileName, byte[] content,
                                   String contentType, UUID actorId) {
        Topic topic = courseRepository.findTopicById(topicId);
        CourseModule module = courseRepository.findModuleById(topic.getModuleId());
        Course course = courseRepository.findCourseById(module.getCourseId())
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        requireOwner(course, actorId);
        String safeName = UUID.randomUUID().toString().substring(0, 8)
                + "_" + fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storagePath = "topics/" + topicId + "/" + safeName;
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
