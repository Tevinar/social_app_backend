CREATE TABLE users(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blogs(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chats(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_id uuid,
  last_message_at timestamptz
);

CREATE TABLE chat_members(
  chat_id uuid NOT NULL,
  member_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_members_pkey PRIMARY KEY (chat_id, member_id),
  CONSTRAINT chat_members_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT chat_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  author_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_id_chat_id_key UNIQUE (id, chat_id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE chats
  ADD CONSTRAINT chats_last_message_id_id_fkey FOREIGN KEY (last_message_id, id) REFERENCES chat_messages(id, chat_id) ON DELETE SET NULL (last_message_id);

CREATE INDEX blogs_author_id_idx ON blogs(author_id);

CREATE INDEX chat_messages_chat_id_idx ON chat_messages(chat_id);

CREATE INDEX chats_last_message_id_idx ON chats(last_message_id);

CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = now();
  RETURN new;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER blogs_set_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER chat_messages_set_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

