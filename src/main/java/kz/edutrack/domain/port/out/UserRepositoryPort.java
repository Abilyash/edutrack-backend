package kz.edutrack.domain.port.out;

import kz.edutrack.domain.model.user.User;
import kz.edutrack.domain.model.user.Role;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {
    User save(User user);
    Optional<User> findById(UUID id);
    boolean existsById(UUID id);
    User updateName(UUID id, String name);
    List<User> findAll();
    User updateRole(UUID id, Role role);
}
