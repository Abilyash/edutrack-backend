package kz.edutrack.web.controller;

import kz.edutrack.application.dto.UserDto;
import kz.edutrack.application.mapper.UserMapper;
import kz.edutrack.domain.model.user.Role;
import kz.edutrack.domain.port.in.GetCurrentUserUseCase;
import kz.edutrack.domain.port.in.SyncUserUseCase;
import kz.edutrack.web.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final GetCurrentUserUseCase getCurrentUser;
    private final SyncUserUseCase syncUser;
    private final UserMapper mapper;

    /**
     * GET /api/v1/users/me
     * При первом запросе — создаёт запись в БД (sync).
     * При последующих — возвращает существующую.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id) {
        UserDto dto = mapper.toDto(getCurrentUser.getCurrentUser(id));
        return ResponseEntity.ok(new UserResponse(dto.id(), dto.email(), dto.name(), dto.role(), dto.createdAt()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        UUID supabaseId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        Role role = extractRole(jwt);

        UserDto dto = mapper.toDto(syncUser.syncFromJwt(supabaseId, email, role));

        return ResponseEntity.ok(new UserResponse(
                dto.id(), dto.email(), dto.name(), dto.role(), dto.createdAt()
        ));
    }

    private Role extractRole(Jwt jwt) {
        Map<String, Object> appMeta = jwt.getClaimAsMap("app_metadata");
        if (appMeta == null) return Role.STUDENT;
        try {
            return Role.valueOf(appMeta.get("role").toString().toUpperCase());
        } catch (Exception e) {
            return Role.STUDENT;
        }
    }
}
