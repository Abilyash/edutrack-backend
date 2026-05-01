package kz.edutrack.domain.model.course;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class Material {
    private final UUID id;
    private final UUID topicId;
    private final String fileName;
    private final String storagePath;   // path within the Supabase bucket
    private final String publicUrl;     // full public URL
    private final MaterialType type;
    private final long sizeBytes;
    private final Instant uploadedAt;
}
