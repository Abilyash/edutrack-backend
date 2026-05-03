package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.submission.Submission;

import java.util.UUID;

public interface SubmitWorkUseCase {
    Submission submit(UUID topicId, String fileName, byte[] content, String contentType, UUID studentId);
}
