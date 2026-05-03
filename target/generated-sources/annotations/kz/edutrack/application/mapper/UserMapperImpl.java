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
    date = "2026-05-03T13:11:09+0500",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
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

        user.createdAt( entity.getCreatedAt() );
        user.email( entity.getEmail() );
        user.id( entity.getId() );
        user.name( entity.getName() );
        user.role( entity.getRole() );

        return user.build();
    }

    @Override
    public UserJpaEntity toEntity(User user) {
        if ( user == null ) {
            return null;
        }

        UserJpaEntity.UserJpaEntityBuilder userJpaEntity = UserJpaEntity.builder();

        userJpaEntity.createdAt( user.getCreatedAt() );
        userJpaEntity.email( user.getEmail() );
        userJpaEntity.id( user.getId() );
        userJpaEntity.name( user.getName() );
        userJpaEntity.role( user.getRole() );

        return userJpaEntity.build();
    }
}
