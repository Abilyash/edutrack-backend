package kz.edutrack.unit.service;

import kz.edutrack.application.service.UserService;
import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.model.user.Role;
import kz.edutrack.domain.model.user.User;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.domain.port.out.UserRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepositoryPort userRepository;
    @Mock AuditEventPublisherPort auditPublisher;
    @InjectMocks UserService userService;

    private final UUID userId = UUID.randomUUID();
    private final String email = "test@example.com";

    @Test
    void syncFromJwt_newUser_createsUserAndPublishesRegisteredEvent() {
        when(userRepository.existsById(userId)).thenReturn(false);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.syncFromJwt(userId, email, Role.STUDENT);

        assertThat(result.getEmail()).isEqualTo(email);
        assertThat(result.getRole()).isEqualTo(Role.STUDENT);
        assertThat(result.getName()).isEqualTo("test");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditPublisher).publish(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.USER_REGISTERED);
        assertThat(captor.getValue().getActorId()).isEqualTo(userId);
    }

    @Test
    void syncFromJwt_existingUser_publishesLoginEvent() {
        User existing = User.builder()
                .id(userId).email(email).name("test")
                .role(Role.STUDENT).createdAt(Instant.now())
                .build();
        when(userRepository.existsById(userId)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));

        userService.syncFromJwt(userId, email, Role.STUDENT);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditPublisher).publish(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.USER_LOGIN);
        verify(userRepository, never()).save(any()); // existing user — no save
    }

    @Test
    void getCurrentUser_notFound_throwsIllegalStateException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUser(userId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(userId.toString());
    }
}
