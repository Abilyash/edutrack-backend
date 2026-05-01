package kz.edutrack.domain.model.course;

public enum MaterialType {
    PDF, VIDEO, CODE_ARCHIVE, DOCUMENT, IMAGE, OTHER;

    public static MaterialType fromContentType(String contentType) {
        if (contentType == null) return OTHER;
        return switch (contentType.toLowerCase()) {
            case "application/pdf"                              -> PDF;
            case "video/mp4", "video/webm"                     -> VIDEO;
            case "application/zip", "application/x-tar"        -> CODE_ARCHIVE;
            case "application/msword",
                 "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> DOCUMENT;
            case String s when s.startsWith("image/")          -> IMAGE;
            default                                             -> OTHER;
        };
    }
}
