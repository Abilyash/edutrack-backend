package kz.edutrack.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "grades")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeJpaEntity {

    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private SubmissionJpaEntity submission;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(nullable = false)
    private int score;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "graded_at", nullable = false)
    private Instant gradedAt;
}
