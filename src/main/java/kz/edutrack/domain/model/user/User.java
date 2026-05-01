package kz.edutrack.domain.model.user;

import lombok.Builder;
import lombok.Getter;
import lombok.With;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@With
public class User {
    private final UUID id;      // = Supabase auth sub (UUID)
    private final String email;
    private final String name;
    private final Role role;
    private final Instant createdAt;
}
