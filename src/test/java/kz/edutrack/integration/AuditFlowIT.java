package kz.edutrack.integration;

import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.infrastructure.persistence.repository.AuditLogJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditFlowIT extends AbstractIntegrationTest {

    @Autowired
    AuditLogJpaRepository auditLogRepository;

    static final UUID TEACHER_ID = UUID.fromString("00000000-0000-0000-0000-000000000030");

    @Test
    void createCourse_publishesAuditEventThatPersistsInDb() throws Exception {
        // Seed teacher
        mockMvc.perform(get("/api/v1/users/me")
                .with(jwt()
                        .jwt(j -> j.subject(TEACHER_ID.toString())
                                .claim("email", "auditteacher@test.com")
                                .claim("app_metadata", Map.of("role", "TEACHER")))
                        .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))));

        long countBefore = auditLogRepository.count();

        // Action — POST /courses → publishes COURSE_CREATED to Kafka
        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Audit Test Course", "description": "Testing audit"}
                                """)
                        .with(jwt()
                                .jwt(j -> j.subject(TEACHER_ID.toString())
                                        .claim("email", "auditteacher@test.com")
                                        .claim("app_metadata", Map.of("role", "TEACHER")))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isCreated());

        // Kafka consumer is async — wait up to 10s for the event to be persisted
        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> {
                    long countAfter = auditLogRepository.count();
                    assertThat(countAfter).isGreaterThan(countBefore);

                    boolean hasCourseCreated = auditLogRepository.findAll().stream()
                            .anyMatch(log -> log.getAction() == AuditAction.COURSE_CREATED
                                    && TEACHER_ID.equals(log.getActorId()));
                    assertThat(hasCourseCreated).isTrue();
                });
    }

    @Test
    void userLogin_publishesAuditEventThatPersistsInDb() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000031");

        mockMvc.perform(get("/api/v1/users/me")
                        .with(jwt()
                                .jwt(j -> j.subject(userId.toString())
                                        .claim("email", "newuser@test.com")
                                        .claim("app_metadata", Map.of("role", "STUDENT")))
                                .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk());

        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> {
                    boolean hasRegistered = auditLogRepository.findAll().stream()
                            .anyMatch(log -> log.getAction() == AuditAction.USER_REGISTERED
                                    && userId.equals(log.getActorId()));
                    assertThat(hasRegistered).isTrue();
                });
    }
}
