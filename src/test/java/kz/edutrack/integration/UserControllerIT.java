package kz.edutrack.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerIT extends AbstractIntegrationTest {

    static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Test
    void getMe_withValidJwt_createsUserOnFirstCallAndReturns200() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .with(jwt()
                                .jwt(j -> j
                                        .subject(USER_ID.toString())
                                        .claim("email", "student@test.com")
                                        .claim("app_metadata", Map.of("role", "STUDENT")))
                                .authorities(
                                        new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(USER_ID.toString()))
                .andExpect(jsonPath("$.email").value("student@test.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void getMe_calledTwice_returnsSameUser() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000002");

        // First call — creates the user
        mockMvc.perform(get("/api/v1/users/me")
                        .with(jwt()
                                .jwt(j -> j.subject(userId.toString())
                                        .claim("email", "teacher@test.com")
                                        .claim("app_metadata", Map.of("role", "TEACHER")))
                                .authorities(
                                        new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isOk());

        // Second call — returns existing user
        mockMvc.perform(get("/api/v1/users/me")
                        .with(jwt()
                                .jwt(j -> j.subject(userId.toString())
                                        .claim("email", "teacher@test.com")
                                        .claim("app_metadata", Map.of("role", "TEACHER")))
                                .authorities(
                                        new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()));
    }

    @Test
    void getMe_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }
}
