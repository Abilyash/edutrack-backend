package kz.edutrack.web.response;

import kz.edutrack.domain.model.user.Role;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        Role role,
        Instant createdAt
) {}
