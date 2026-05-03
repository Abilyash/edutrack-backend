CREATE TABLE IF NOT EXISTS submissions (
    id           UUID         PRIMARY KEY,
    topic_id     UUID         NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    student_id   UUID         NOT NULL REFERENCES users(id),
    file_name    VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url   VARCHAR(500),
    status       VARCHAR(50)  NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grades (
    id            UUID        PRIMARY KEY,
    submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
    teacher_id    UUID        NOT NULL REFERENCES users(id),
    score         INT         NOT NULL CHECK (score >= 0 AND score <= 100),
    comment       TEXT,
    graded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_topic_id   ON submissions(topic_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_grades_submission_id   ON grades(submission_id);
