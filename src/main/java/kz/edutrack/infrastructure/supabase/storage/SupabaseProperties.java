package kz.edutrack.infrastructure.supabase.storage;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "supabase")
public record SupabaseProperties(
        @NotBlank String url,
        @NotBlank String serviceRoleKey,
        Storage storage
) {
    public record Storage(@NotBlank String bucket) {}
}
