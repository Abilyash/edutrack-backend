package kz.edutrack.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CourseControllerIT extends AbstractIntegrationTest {

    static final UUID TEACHER_ID = UUID.fromString("00000000-0000-0000-0000-000000000010");
    static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000020");

    @BeforeEach
    void seedUsers() throws Exception {
        // Ensure teacher and student exist in DB before course tests
        mockMvc.perform(get("/api/v1/users/me")
                .with(jwt()
                        .jwt(j -> j.subject(TEACHER_ID.toString())
                                .claim("email", "teacher@test.com")
                                .claim("app_metadata", Map.of("role", "TEACHER")))
                        .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))));

        mockMvc.perform(get("/api/v1/users/me")
                .with(jwt()
                        .jwt(j -> j.subject(STUDENT_ID.toString())
                                .claim("email", "student@test.com")
                                .claim("app_metadata", Map.of("role", "STUDENT")))
                        .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    @Test
    void createCourse_asTeacher_returns201WithCourseData() throws Exception {
        String body = """
                {"title": "Spring Boot Course", "description": "Learn Spring Boot 3"}
                """;

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(jwt()
                                .jwt(j -> j.subject(TEACHER_ID.toString())
                                        .claim("email", "teacher@test.com")
                                        .claim("app_metadata", Map.of("role", "TEACHER")))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Spring Boot Course"))
                .andExpect(jsonPath("$.published").value(false))
                .andExpect(jsonPath("$.teacherId").value(TEACHER_ID.toString()));
    }

    @Test
    void createCourse_asStudent_returns403() throws Exception {
        String body = """
                {"title": "Hacked Course", "description": "Should fail"}
                """;

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(jwt()
                                .jwt(j -> j.subject(STUDENT_ID.toString())
                                        .claim("email", "student@test.com"))
                                .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void createCourse_missingTitle_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "", "description": "No title"}
                                """)
                        .with(jwt()
                                .jwt(j -> j.subject(TEACHER_ID.toString()))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listCourses_authenticated_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/courses")
                        .with(jwt()
                                .jwt(j -> j.subject(STUDENT_ID.toString()))
                                .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void listCourses_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isUnauthorized());
    }
}
