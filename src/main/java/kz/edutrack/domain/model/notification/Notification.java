package kz.edutrack.domain.model.notification;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class Notification {
    private final UUID id;
    private final UUID userId;
    private final String message;
    private final boolean read;
    private final Instant createdAt;
}
