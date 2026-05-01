CREATE TABLE IF NOT EXISTS courses (
    id          UUID         PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id  UUID         NOT NULL REFERENCES users(id),
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_modules (
    id          UUID         PRIMARY KEY,
    course_id   UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    order_index INT          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
    id          UUID         PRIMARY KEY,
    module_id   UUID         NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    order_index INT          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS materials (
    id           UUID         PRIMARY KEY,
    topic_id     UUID         NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url   VARCHAR(500) NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    size_bytes   BIGINT       NOT NULL,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_teacher_id    ON courses(teacher_id);
CREATE INDEX idx_modules_course_id     ON course_modules(course_id);
CREATE INDEX idx_topics_module_id      ON topics(module_id);
CREATE INDEX idx_materials_topic_id    ON materials(topic_id);
