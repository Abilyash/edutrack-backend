package kz.edutrack.domain.model.course;

public enum MaterialType {
    PDF, VIDEO, CODE_ARCHIVE, DOCUMENT, IMAGE, OTHER;

    public static MaterialType fromContentType(String contentType) {
        if (contentType == null) return OTHER;
        String ct = contentType.toLowerCase();
        if (ct.startsWith("image/")) return IMAGE;
        return switch (ct) {
            case "application/pdf"                              -> PDF;
            case "video/mp4", "video/webm"                     -> VIDEO;
            case "application/zip", "application/x-tar"        -> CODE_ARCHIVE;
            case "application/msword",
                 "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> DOCUMENT;
            default                                             -> OTHER;
        };
    }
}
