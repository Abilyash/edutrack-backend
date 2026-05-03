package kz.edutrack.infrastructure.persistence.repository;

import kz.edutrack.infrastructure.persistence.entity.SubmissionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SubmissionJpaRepository extends JpaRepository<SubmissionJpaEntity, UUID> {
    @Query("SELECT s FROM SubmissionJpaEntity s LEFT JOIN FETCH s.grade WHERE s.topicId = :topicId")
    List<SubmissionJpaEntity> findByTopicId(UUID topicId);

    @Query("SELECT s FROM SubmissionJpaEntity s LEFT JOIN FETCH s.grade WHERE s.studentId = :studentId")
    List<SubmissionJpaEntity> findByStudentId(UUID studentId);

    boolean existsByTopicIdAndStudentId(UUID topicId, UUID studentId);

    @Query(value = """
        SELECT COUNT(s.id) FROM submissions s
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE g.id IS NULL
        AND s.topic_id IN (
            SELECT t.id FROM topics t
            JOIN course_modules m ON t.module_id = m.id
            JOIN courses c ON m.course_id = c.id
            WHERE c.teacher_id = :teacherId
        )
        """, nativeQuery = true)
    int countPendingByTeacherId(@Param("teacherId") UUID teacherId);
}
