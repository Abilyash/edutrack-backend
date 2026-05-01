package kz.edutrack.application.dto;

import kz.edutrack.domain.model.user.Role;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String name,
        Role role,
        Instant createdAt
) {}
