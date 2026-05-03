package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.course.Course;

import java.util.UUID;

public interface CreateCourseUseCase {
    Course createCourse(String title, String description, UUID teacherId);
    Course togglePublish(UUID courseId, boolean published, UUID actorId);
}
