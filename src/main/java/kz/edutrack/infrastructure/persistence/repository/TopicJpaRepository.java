package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.TopicJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TopicJpaRepository extends JpaRepository<TopicJpaEntity, UUID> {
    int countByModuleId(UUID moduleId);
}
