package kz.edutrack.infrastructure.persistence.adapter;

import kz.edutrack.domain.model.course.*;
import kz.edutrack.domain.port.out.CourseRepositoryPort;
import kz.edutrack.infrastructure.persistence.entity.*;
import kz.edutrack.infrastructure.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CoursePersistenceAdapter implements CourseRepositoryPort {

    private final CourseJpaRepository courseRepo;
    private final CourseModuleJpaRepository moduleRepo;
    private final TopicJpaRepository topicRepo;
    private final MaterialJpaRepository materialRepo;

    // ── Course ─────────────────────────────────────────────────────────────

    @Override
    public Course saveCourse(Course course) {
        return toDomain(courseRepo.save(toEntity(course)));
    }

    @Override
    public Optional<Course> findCourseById(UUID id) {
        return courseRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<Course> findAllCourses() {
        return courseRepo.findAllWithModules().stream().map(this::toDomain).toList();
    }

    @Override
    public List<Course> findCoursesByTeacherId(UUID teacherId) {
        return courseRepo.findAllByTeacherId(teacherId).stream().map(this::toDomain).toList();
    }

    // ── Module ─────────────────────────────────────────────────────────────

    @Override
    public CourseModule saveModule(CourseModule module) {
        CourseJpaEntity courseRef = courseRepo.getReferenceById(module.getCourseId());
        CourseModuleJpaEntity entity = CourseModuleJpaEntity.builder()
                .id(module.getId())
                .course(courseRef)
                .title(module.getTitle())
                .orderIndex(module.getOrderIndex())
                .build();
        return toDomain(moduleRepo.save(entity));
    }

    @Override
    public int countModulesByCourseId(UUID courseId) {
        return moduleRepo.countByCourseId(courseId);
    }

    // ── Topic ──────────────────────────────────────────────────────────────

    @Override
    public Topic saveTopic(Topic topic) {
        CourseModuleJpaEntity moduleRef = moduleRepo.getReferenceById(topic.getModuleId());
        TopicJpaEntity entity = TopicJpaEntity.builder()
                .id(topic.getId())
                .module(moduleRef)
                .title(topic.getTitle())
                .content(topic.getContent())
                .orderIndex(topic.getOrderIndex())
                .build();
        return toDomain(topicRepo.save(entity));
    }

    @Override
    public int countTopicsByModuleId(UUID moduleId) {
        return topicRepo.countByModuleId(moduleId);
    }

    // ── Material ───────────────────────────────────────────────────────────

    @Override
    public Material saveMaterial(Material material) {
        TopicJpaEntity topicRef = topicRepo.getReferenceById(material.getTopicId());
        MaterialJpaEntity entity = MaterialJpaEntity.builder()
                .id(material.getId())
                .topic(topicRef)
                .fileName(material.getFileName())
                .storagePath(material.getStoragePath())
                .publicUrl(material.getPublicUrl())
                .type(material.getType())
                .sizeBytes(material.getSizeBytes())
                .uploadedAt(material.getUploadedAt())
                .build();
        return toDomain(materialRepo.save(entity));
    }

    // ── Mappers (entity ↔ domain) ──────────────────────────────────────────

    private Course toDomain(CourseJpaEntity e) {
        return Course.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .teacherId(e.getTeacherId())
                .published(e.isPublished())
                .createdAt(e.getCreatedAt())
                .modules(e.getModules().stream().map(this::toDomain).toList())
                .build();
    }

    private CourseModule toDomain(CourseModuleJpaEntity e) {
        return CourseModule.builder()
                .id(e.getId())
                .courseId(e.getCourse().getId())
                .title(e.getTitle())
                .orderIndex(e.getOrderIndex())
                .topics(e.getTopics().stream().map(this::toDomain).toList())
                .build();
    }

    private Topic toDomain(TopicJpaEntity e) {
        return Topic.builder()
                .id(e.getId())
                .moduleId(e.getModule().getId())
                .title(e.getTitle())
                .content(e.getContent())
                .orderIndex(e.getOrderIndex())
                .materials(e.getMaterials().stream().map(this::toDomain).toList())
                .build();
    }

    private Material toDomain(MaterialJpaEntity e) {
        return Material.builder()
                .id(e.getId())
                .topicId(e.getTopic().getId())
                .fileName(e.getFileName())
                .storagePath(e.getStoragePath())
                .publicUrl(e.getPublicUrl())
                .type(e.getType())
                .sizeBytes(e.getSizeBytes())
                .uploadedAt(e.getUploadedAt())
                .build();
    }

    private CourseJpaEntity toEntity(Course c) {
        return CourseJpaEntity.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .teacherId(c.getTeacherId())
                .published(c.isPublished())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
