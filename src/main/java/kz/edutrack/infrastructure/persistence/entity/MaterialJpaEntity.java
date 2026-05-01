package kz.edutrack.infrastructure.persistence.entity;

import jakarta.persistence.*;
import kz.edutrack.domain.model.course.MaterialType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialJpaEntity {

    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private TopicJpaEntity topic;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "public_url", nullable = false)
    private String publicUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialType type;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;
}
