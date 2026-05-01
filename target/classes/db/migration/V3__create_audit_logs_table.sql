CREATE TABLE IF NOT EXISTS audit_logs (
    id           UUID         PRIMARY KEY,
    action       VARCHAR(50)  NOT NULL,
    actor_id     UUID,
    actor_email  VARCHAR(255),
    target_id    UUID,
    target_type  VARCHAR(50),
    metadata     JSONB,
    occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_id    ON audit_logs(actor_id);
CREATE INDEX idx_audit_action      ON audit_logs(action);
CREATE INDEX idx_audit_occurred_at ON audit_logs(occurred_at DESC);
