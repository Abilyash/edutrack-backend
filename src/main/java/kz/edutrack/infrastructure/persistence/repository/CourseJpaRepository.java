package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.CourseJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CourseJpaRepository extends JpaRepository<CourseJpaEntity, UUID> {

    List<CourseJpaEntity> findAllByTeacherId(UUID teacherId);

    @Query("SELECT DISTINCT c FROM CourseJpaEntity c LEFT JOIN FETCH c.modules")
    List<CourseJpaEntity> findAllWithModules();

    @Query("SELECT DISTINCT c FROM CourseJpaEntity c LEFT JOIN FETCH c.modules WHERE c.published = true")
    List<CourseJpaEntity> findAllPublishedWithModules();
}
