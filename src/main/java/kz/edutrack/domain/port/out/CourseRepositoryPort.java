package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Material;
import kz.edutrack.domain.model.course.Topic;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseRepositoryPort {
    Course saveCourse(Course course);
    Optional<Course> findCourseById(UUID id);
    List<Course> findAllCourses();
    List<Course> findCoursesByTeacherId(UUID teacherId);

    CourseModule saveModule(CourseModule module);
    int countModulesByCourseId(UUID courseId);

    Topic saveTopic(Topic topic);
    int countTopicsByModuleId(UUID moduleId);

    Material saveMaterial(Material material);
}
