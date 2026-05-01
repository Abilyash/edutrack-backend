package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.CourseModuleJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CourseModuleJpaRepository extends JpaRepository<CourseModuleJpaEntity, UUID> {
    int countByCourseId(UUID courseId);
}
