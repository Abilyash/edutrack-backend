package kz.edutrack.domain.port.out;

public interface MaterialStoragePort {
    /** Uploads content and returns the public URL. */
    String upload(String storagePath, byte[] content, String contentType);
    void delete(String storagePath);
}
