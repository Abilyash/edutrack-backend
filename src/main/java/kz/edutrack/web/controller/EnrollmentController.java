package kz.edutrack.web.controller;

import kz.edutrack.domain.port.in.EnrollCourseUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollCourseUseCase enrollCourse;

    @PostMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public void enroll(@PathVariable UUID courseId, @AuthenticationPrincipal Jwt jwt) {
        enrollCourse.enroll(courseId, UUID.fromString(jwt.getSubject()));
    }

    @DeleteMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unenroll(@PathVariable UUID courseId, @AuthenticationPrincipal Jwt jwt) {
        enrollCourse.unenroll(courseId, UUID.fromString(jwt.getSubject()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public List<UUID> myEnrollments(@AuthenticationPrincipal Jwt jwt) {
        return enrollCourse.getEnrolledCourseIds(UUID.fromString(jwt.getSubject()));
    }
}
