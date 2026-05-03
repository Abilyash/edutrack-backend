package kz.edutrack.web.controller;

import jakarta.validation.Valid;
import kz.edutrack.application.dto.CourseDto;
import kz.edutrack.application.dto.CourseModuleDto;
import kz.edutrack.application.dto.MaterialDto;
import kz.edutrack.application.dto.TopicDto;
import kz.edutrack.application.mapper.CourseMapper;
import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.port.in.*;
import kz.edutrack.web.request.CreateCourseRequest;
import kz.edutrack.web.request.CreateModuleRequest;
import kz.edutrack.web.request.CreateTopicRequest;
import kz.edutrack.web.request.UpdateCourseRequest;
import kz.edutrack.web.request.UpdateModuleRequest;
import kz.edutrack.web.request.UpdateTopicRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.util.Map;
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
    public List<CourseDto> listCourses(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> appMeta = jwt.getClaimAsMap("app_metadata");
        String role = appMeta != null
                ? String.valueOf(appMeta.getOrDefault("role", "STUDENT")).toUpperCase()
                : "STUDENT";
        boolean isTeacher = role.equals("TEACHER") || role.equals("ADMIN");
        List<Course> courses = isTeacher ? getCourse.getAllCourses() : getCourse.getPublishedCourses();
        return courses.stream().map(mapper::toDto).toList();
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
        return mapper.toDto(addModule.addTopic(moduleId, req.title(), req.content(), req.deadline(), actorId));
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCourse(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        createCourse.deleteCourse(id, UUID.fromString(jwt.getSubject()));
    }

    @DeleteMapping("/topics/{topicId}/materials/{materialId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMaterial(@PathVariable UUID topicId,
                               @PathVariable UUID materialId,
                               @AuthenticationPrincipal Jwt jwt) {
        createCourse.deleteMaterial(materialId, UUID.fromString(jwt.getSubject()));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public CourseDto publish(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return mapper.toDto(createCourse.togglePublish(id, true, UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public CourseDto unpublish(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return mapper.toDto(createCourse.togglePublish(id, false, UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public CourseDto updateCourse(@PathVariable UUID id,
                                  @Valid @RequestBody UpdateCourseRequest req,
                                  @AuthenticationPrincipal Jwt jwt) {
        return mapper.toDto(createCourse.updateCourse(id, req.title(), req.description(),
                UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/modules/{moduleId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public CourseModuleDto updateModule(@PathVariable UUID moduleId,
                                        @Valid @RequestBody UpdateModuleRequest req,
                                        @AuthenticationPrincipal Jwt jwt) {
        return mapper.toDto(addModule.updateModule(moduleId, req.title(),
                UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/topics/{topicId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public TopicDto updateTopic(@PathVariable UUID topicId,
                                @Valid @RequestBody UpdateTopicRequest req,
                                @AuthenticationPrincipal Jwt jwt) {
        return mapper.toDto(addModule.updateTopic(topicId, req.title(), req.content(), req.deadline(),
                UUID.fromString(jwt.getSubject())));
    }
}
