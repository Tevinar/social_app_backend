ALTER TABLE refresh_sessions
    ADD COLUMN device_id uuid;

UPDATE refresh_sessions
SET device_id = id
WHERE device_id IS NULL;

ALTER TABLE refresh_sessions
    ALTER COLUMN device_id SET NOT NULL;

CREATE UNIQUE INDEX refresh_sessions_user_id_device_id_idx
    ON refresh_sessions(user_id, device_id);
