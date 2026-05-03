package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Topic;

import java.time.Instant;
import java.util.UUID;

public interface AddModuleUseCase {
    CourseModule addModule(UUID courseId, String title, UUID actorId);
    CourseModule updateModule(UUID moduleId, String title, UUID actorId);
    Topic addTopic(UUID moduleId, String title, String content, Instant deadline, UUID actorId);
    Topic updateTopic(UUID topicId, String title, String content, Instant deadline, UUID actorId);
}
