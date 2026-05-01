package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.CourseJpaEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseJpaRepository extends JpaRepository<CourseJpaEntity, UUID> {

    List<CourseJpaEntity> findAllByTeacherId(UUID teacherId);

    // Loads full tree (modules → topics → materials) in one query
    @EntityGraph(attributePaths = {"modules", "modules.topics", "modules.topics.materials"})
    Optional<CourseJpaEntity> findWithFullTreeById(UUID id);
}
