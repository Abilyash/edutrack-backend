package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.user.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {
    User save(User user);
    Optional<User> findById(UUID id);
    boolean existsById(UUID id);
}
