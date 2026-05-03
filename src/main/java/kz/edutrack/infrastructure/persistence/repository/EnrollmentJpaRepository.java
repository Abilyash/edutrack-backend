package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.EnrollmentJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EnrollmentJpaRepository extends JpaRepository<EnrollmentJpaEntity, UUID> {
    boolean existsByStudentIdAndCourseId(UUID studentId, UUID courseId);
    void deleteByStudentIdAndCourseId(UUID studentId, UUID courseId);
    List<EnrollmentJpaEntity> findByStudentId(UUID studentId);
    int countByCourseId(UUID courseId);
}
