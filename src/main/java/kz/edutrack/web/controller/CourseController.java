package kz.edutrack.web.controller;

import jakarta.validation.Valid;
import kz.edutrack.application.dto.CourseDto;
import kz.edutrack.application.dto.CourseModuleDto;
import kz.edutrack.application.dto.MaterialDto;
import kz.edutrack.application.dto.TopicDto;
import kz.edutrack.application.mapper.CourseMapper;
import kz.edutrack.domain.port.in.*;
import kz.edutrack.web.request.CreateCourseRequest;
import kz.edutrack.web.request.CreateModuleRequest;
import kz.edutrack.web.request.CreateTopicRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CreateCourseUseCase createCourse;
    private final GetCourseUseCase getCourse;
    private final AddModuleUseCase addModule;
    private final UploadMaterialUseCase uploadMaterial;
    private final CourseMapper mapper;

    @GetMapping
    public List<CourseDto> listCourses() {
        return getCourse.getAllCourses().stream().map(mapper::toDto).toList();
    }

    @GetMapping("/{id}")
    public CourseDto getCourseById(@PathVariable UUID id) {
        return mapper.toDto(getCourse.getCourseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseDto createCourse(
            @Valid @RequestBody CreateCourseRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        UUID teacherId = UUID.fromString(jwt.getSubject());
        return mapper.toDto(createCourse.createCourse(req.title(), req.description(), teacherId));
    }

    @PostMapping("/{courseId}/modules")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseModuleDto addModule(
            @PathVariable UUID courseId,
            @Valid @RequestBody CreateModuleRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return mapper.toDto(addModule.addModule(courseId, req.title(), actorId));
    }

    @PostMapping("/modules/{moduleId}/topics")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TopicDto addTopic(
            @PathVariable UUID moduleId,
            @Valid @RequestBody CreateTopicRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return mapper.toDto(addModule.addTopic(moduleId, req.title(), req.content(), actorId));
    }

    @PostMapping(value = "/topics/{topicId}/materials",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialDto uploadMaterial(
            @PathVariable UUID topicId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return mapper.toDto(uploadMaterial.uploadMaterial(
                topicId,
                file.getOriginalFilename(),
                file.getBytes(),
                file.getContentType(),
                actorId
        ));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public List<CourseDto> myCourses(@AuthenticationPrincipal Jwt jwt) {
        UUID teacherId = UUID.fromString(jwt.getSubject());
        return getCourse.getCoursesByTeacher(teacherId).stream().map(mapper::toDto).toList();
    }
}
