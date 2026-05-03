package kz.edutrack.infrastructure.persistence.adapter;

import kz.edutrack.application.mapper.UserMapper;
import kz.edutrack.domain.model.user.User;
import kz.edutrack.domain.port.out.UserRepositoryPort;
import kz.edutrack.infrastructure.persistence.entity.UserJpaEntity;
import kz.edutrack.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserRepositoryPort {

    private final UserJpaRepository jpaRepository;
    private final UserMapper mapper;

    @Override
    public User save(User user) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(user)));
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsById(UUID id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public User updateName(UUID id, String name) {
        UserJpaEntity e = jpaRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("User not found: " + id));
        e.setName(name);
        return mapper.toDomain(jpaRepository.save(e));
    }
}
