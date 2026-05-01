package kz.edutrack.application.mapper;

import kz.edutrack.application.dto.UserDto;
import kz.edutrack.domain.model.user.User;
import kz.edutrack.infrastructure.persistence.entity.UserJpaEntity;
import org.mapstruct.Mapper;

@Mapper
public interface UserMapper {
    UserDto toDto(User user);
    User toDomain(UserJpaEntity entity);
    UserJpaEntity toEntity(User user);
}
