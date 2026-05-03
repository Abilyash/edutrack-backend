package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.enrollment.Enrollment;

import java.util.List;
import java.util.UUID;

public interface EnrollCourseUseCase {
    Enrollment enroll(UUID courseId, UUID studentId);
    void unenroll(UUID courseId, UUID studentId);
    boolean isEnrolled(UUID courseId, UUID studentId);
    List<UUID> getEnrolledCourseIds(UUID studentId);
    int countEnrolled(UUID courseId);
}
