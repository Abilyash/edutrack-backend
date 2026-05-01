package kz.edutrack.infrastructure.supabase.storage;

import kz.edutrack.domain.port.out.MaterialStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class SupabaseStorageAdapter implements MaterialStoragePort {

    private final RestClient supabaseStorageClient;
    private final SupabaseProperties properties;

    @Override
    public String upload(String storagePath, byte[] content, String contentType) {
        String bucket = properties.storage().bucket();

        supabaseStorageClient.post()
                .uri("/storage/v1/object/{bucket}/{path}", bucket, storagePath)
                .contentType(MediaType.parseMediaType(contentType))
                .body(content)
                .retrieve()
                .toBodilessEntity();

        return properties.url() + "/storage/v1/object/public/" + bucket + "/" + storagePath;
    }

    @Override
    public void delete(String storagePath) {
        String bucket = properties.storage().bucket();

        supabaseStorageClient.delete()
                .uri("/storage/v1/object/{bucket}/{path}", bucket, storagePath)
                .retrieve()
                .toBodilessEntity();
    }
}
