package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.course.Material;

import java.util.UUID;

public interface UploadMaterialUseCase {
    Material uploadMaterial(UUID topicId, String fileName, byte[] content, String contentType, UUID actorId);
}
