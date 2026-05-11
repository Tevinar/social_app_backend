DROP INDEX IF EXISTS refresh_sessions_user_id_device_id_idx;

CREATE UNIQUE INDEX refresh_sessions_active_user_id_device_id_idx
    ON refresh_sessions(user_id, device_id)
    WHERE revoked_at IS NULL;
