package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.course.Course;

import java.util.List;
import java.util.UUID;

public interface GetCourseUseCase {
    Course getCourseById(UUID id);
    List<Course> getAllCourses();
    List<Course> getPublishedCourses();
    List<Course> getCoursesByTeacher(UUID teacherId);
}
