package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.MaterialJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MaterialJpaRepository extends JpaRepository<MaterialJpaEntity, UUID> {
}
