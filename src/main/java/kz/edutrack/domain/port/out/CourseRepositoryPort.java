package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Material;
import kz.edutrack.domain.model.course.Topic;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseRepositoryPort {
    Course saveCourse(Course course);
    Optional<Course> findCourseById(UUID id);
    List<Course> findAllCourses();
    List<Course> findAllPublishedCourses();
    List<Course> findCoursesByTeacherId(UUID teacherId);
    Course updatePublished(UUID id, boolean published);
    Course updateCourseDetails(UUID id, String title, String description);

    CourseModule saveModule(CourseModule module);
    CourseModule findModuleById(UUID moduleId);
    int countModulesByCourseId(UUID courseId);
    CourseModule updateModuleTitle(UUID id, String title);

    Topic saveTopic(Topic topic);
    Topic findTopicById(UUID topicId);
    int countTopicsByModuleId(UUID moduleId);
    Topic updateTopicDetails(UUID id, String title, String content, Instant deadline);

    Material saveMaterial(Material material);
    Optional<Material> findMaterialById(UUID id);
    void deleteMaterialById(UUID id);
    void deleteCourseById(UUID id);
}
