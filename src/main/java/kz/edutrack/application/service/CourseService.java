package kz.edutrack.application.service;

import kz.edutrack.domain.model.course.*;
import kz.edutrack.domain.port.in.*;
import kz.edutrack.domain.port.out.CourseRepositoryPort;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
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
        return courseRepository.saveCourse(course);
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
    public CourseModule addModule(UUID courseId, String title) {
        if (!courseRepository.findCourseById(courseId).isPresent()) {
            throw new IllegalStateException("Course not found: " + courseId);
        }
        int order = courseRepository.countModulesByCourseId(courseId);
        CourseModule module = CourseModule.builder()
                .id(UUID.randomUUID())
                .courseId(courseId)
                .title(title)
                .orderIndex(order)
                .topics(List.of())
                .build();
        return courseRepository.saveModule(module);
    }

    @Override
    @Transactional
    public Topic addTopic(UUID moduleId, String title, String content) {
        int order = courseRepository.countTopicsByModuleId(moduleId);
        Topic topic = Topic.builder()
                .id(UUID.randomUUID())
                .moduleId(moduleId)
                .title(title)
                .content(content)
                .orderIndex(order)
                .materials(List.of())
                .build();
        return courseRepository.saveTopic(topic);
    }

    // ── UploadMaterialUseCase ──────────────────────────────────────────────

    @Override
    @Transactional
    public Material uploadMaterial(UUID topicId, String fileName, byte[] content, String contentType) {
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
        return courseRepository.saveMaterial(material);
    }
}
