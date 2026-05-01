package kz.edutrack.application.service;

import kz.edutrack.domain.model.user.Role;
import kz.edutrack.domain.model.user.User;
import kz.edutrack.domain.port.in.GetCurrentUserUseCase;
import kz.edutrack.domain.port.in.SyncUserUseCase;
import kz.edutrack.domain.port.out.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements GetCurrentUserUseCase, SyncUserUseCase {

    private final UserRepositoryPort userRepository;

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser(UUID supabaseId) {
        return userRepository.findById(supabaseId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + supabaseId));
    }

    @Override
    @Transactional
    public User syncFromJwt(UUID supabaseId, String email, Role role) {
        return userRepository.findById(supabaseId).orElseGet(() -> {
            User newUser = User.builder()
                    .id(supabaseId)
                    .email(email)
                    .name(extractNameFromEmail(email))
                    .role(role)
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(newUser);
        });
    }

    private String extractNameFromEmail(String email) {
        return email.substring(0, email.indexOf('@'));
    }
}
