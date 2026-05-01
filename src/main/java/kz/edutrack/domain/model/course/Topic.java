package kz.edutrack.domain.model.course;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class Topic {
    private final UUID id;
    private final UUID moduleId;
    private final String title;
    private final String content;
    private final int orderIndex;
    private final List<Material> materials;
}
