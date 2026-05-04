package kz.edutrack.web.controller;

import jakarta.validation.Valid;
import kz.edutrack.application.dto.SubmissionDto;
import kz.edutrack.application.mapper.SubmissionMapper;
import kz.edutrack.domain.port.in.GradeSubmissionUseCase;
import kz.edutrack.domain.port.in.SubmitWorkUseCase;
import kz.edutrack.infrastructure.persistence.repository.SubmissionJpaRepository;
import kz.edutrack.web.request.GradeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@SuppressWarnings("java:S1192")
class AllowedFileTypes {
    static final Set<String> MIME_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "application/zip",
            "application/x-zip-compressed",
            "image/jpeg",
            "image/png"
    );
    static final long MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
    private AllowedFileTypes() {}
}

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmitWorkUseCase submitWork;
    private final GradeSubmissionUseCase gradeSubmission;
    private final SubmissionMapper mapper;
    private final SubmissionJpaRepository submissionRepo;

    @PostMapping(value = "/topics/{topicId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionDto submit(
            @PathVariable UUID topicId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл не может быть пустым");
        }
        if (file.getSize() > AllowedFileTypes.MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Размер файла превышает допустимые 20 МБ");
        }
        String contentType = file.getContentType();
        if (contentType == null || !AllowedFileTypes.MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Недопустимый тип файла. Разрешены: PDF, Word, Excel, PowerPoint, TXT, ZIP, JPEG, PNG");
        }
        UUID studentId = UUID.fromString(jwt.getSubject());
        return mapper.toDto(submitWork.submit(
                topicId, file.getOriginalFilename(), file.getBytes(), contentType, studentId));
    }

    @GetMapping("/topics/{topicId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public List<SubmissionDto> byTopic(@PathVariable UUID topicId) {
        return gradeSubmission.getSubmissionsByTopic(topicId).stream().map(mapper::toDto).toList();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public List<SubmissionDto> mySubmissions(@AuthenticationPrincipal Jwt jwt) {
        UUID studentId = UUID.fromString(jwt.getSubject());
        return gradeSubmission.getMySubmissions(studentId).stream().map(mapper::toDto).toList();
    }

    @DeleteMapping("/{submissionId}")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubmission(@PathVariable UUID submissionId,
                                 @AuthenticationPrincipal Jwt jwt) {
        UUID studentId = UUID.fromString(jwt.getSubject());
        gradeSubmission.deleteSubmission(submissionId, studentId);
    }

    @GetMapping("/pending-count")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Map<String, Integer> pendingCount(@AuthenticationPrincipal Jwt jwt) {
        UUID teacherId = UUID.fromString(jwt.getSubject());
        return Map.of("count", submissionRepo.countPendingByTeacherId(teacherId));
    }

    @PostMapping("/{submissionId}/grade")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public SubmissionDto grade(
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        UUID teacherId = UUID.fromString(jwt.getSubject());
        return mapper.toDto(gradeSubmission.grade(submissionId, req.score(), req.comment(), teacherId));
    }
}
