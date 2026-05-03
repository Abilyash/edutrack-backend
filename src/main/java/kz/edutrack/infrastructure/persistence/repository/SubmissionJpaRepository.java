package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.SubmissionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SubmissionJpaRepository extends JpaRepository<SubmissionJpaEntity, UUID> {
    @Query("SELECT s FROM SubmissionJpaEntity s LEFT JOIN FETCH s.grade WHERE s.topicId = :topicId")
    List<SubmissionJpaEntity> findByTopicId(UUID topicId);

    @Query("SELECT s FROM SubmissionJpaEntity s LEFT JOIN FETCH s.grade WHERE s.studentId = :studentId")
    List<SubmissionJpaEntity> findByStudentId(UUID studentId);

    boolean existsByTopicIdAndStudentId(UUID topicId, UUID studentId);
}
