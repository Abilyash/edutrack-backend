package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.user.User;

import java.util.UUID;

public interface GetCurrentUserUseCase {
    User getCurrentUser(UUID supabaseId);
}
