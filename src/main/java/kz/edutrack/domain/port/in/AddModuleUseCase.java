package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Topic;

import java.util.UUID;

public interface AddModuleUseCase {
    CourseModule addModule(UUID courseId, String title);
    Topic addTopic(UUID moduleId, String title, String content);
}
