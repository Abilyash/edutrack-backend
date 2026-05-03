package kz.edutrack.application.mapper;

import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import kz.edutrack.application.dto.UserDto;
import kz.edutrack.domain.model.user.Role;
import kz.edutrack.domain.model.user.User;
import kz.edutrack.infrastructure.persistence.entity.UserJpaEntity;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-04T03:05:56+0500",
    comments = "version: 1.6.3, compiler: javac, environment: Java 17.0.18 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDto toDto(User user) {
        if ( user == null ) {
            return null;
        }

        UUID id = null;
        String email = null;
        String name = null;
        Role role = null;
        Instant createdAt = null;

        id = user.getId();
        email = user.getEmail();
        name = user.getName();
        role = user.getRole();
        createdAt = user.getCreatedAt();

        UserDto userDto = new UserDto( id, email, name, role, createdAt );

        return userDto;
    }

    @Override
    public User toDomain(UserJpaEntity entity) {
        if ( entity == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.id( entity.getId() );
        user.email( entity.getEmail() );
        user.name( entity.getName() );
        user.role( entity.getRole() );
        user.createdAt( entity.getCreatedAt() );

        return user.build();
    }

    @Override
    public UserJpaEntity toEntity(User user) {
        if ( user == null ) {
            return null;
        }

        UserJpaEntity.UserJpaEntityBuilder userJpaEntity = UserJpaEntity.builder();

        userJpaEntity.id( user.getId() );
        userJpaEntity.email( user.getEmail() );
        userJpaEntity.name( user.getName() );
        userJpaEntity.role( user.getRole() );
        userJpaEntity.createdAt( user.getCreatedAt() );

        return userJpaEntity.build();
    }
}
