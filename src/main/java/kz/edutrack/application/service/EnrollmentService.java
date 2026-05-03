package kz.edutrack.application.service;

import kz.edutrack.domain.model.enrollment.Enrollment;
import kz.edutrack.domain.port.in.EnrollCourseUseCase;
import kz.edutrack.infrastructure.persistence.entity.EnrollmentJpaEntity;
import kz.edutrack.infrastructure.persistence.repository.EnrollmentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnrollmentService implements EnrollCourseUseCase {

    private final EnrollmentJpaRepository enrollmentRepo;

    @Override
    @Transactional
    public Enrollment enroll(UUID courseId, UUID studentId) {
        if (enrollmentRepo.existsByStudentIdAndCourseId(studentId, courseId)) {
            return enrollmentRepo.findByStudentId(studentId).stream()
                    .filter(e -> e.getCourseId().equals(courseId))
                    .findFirst()
                    .map(this::toDomain)
                    .orElseThrow();
        }
        EnrollmentJpaEntity entity = EnrollmentJpaEntity.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .courseId(courseId)
                .enrolledAt(Instant.now())
                .build();
        return toDomain(enrollmentRepo.save(entity));
    }

    @Override
    @Transactional
    public void unenroll(UUID courseId, UUID studentId) {
        enrollmentRepo.deleteByStudentIdAndCourseId(studentId, courseId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEnrolled(UUID courseId, UUID studentId) {
        return enrollmentRepo.existsByStudentIdAndCourseId(studentId, courseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getEnrolledCourseIds(UUID studentId) {
        return enrollmentRepo.findByStudentId(studentId).stream()
                .map(EnrollmentJpaEntity::getCourseId)
                .toList();
    }

    private Enrollment toDomain(EnrollmentJpaEntity e) {
        return Enrollment.builder()
                .id(e.getId())
                .studentId(e.getStudentId())
                .courseId(e.getCourseId())
                .enrolledAt(e.getEnrolledAt())
                .build();
    }
}
