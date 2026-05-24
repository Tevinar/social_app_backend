CREATE INDEX blogs_created_at_id_desc_idx ON blogs(created_at DESC, id DESC);

CREATE INDEX chat_members_member_id_chat_id_idx
    ON chat_members(member_id, chat_id);

CREATE INDEX chats_last_message_at_id_desc_idx
    ON chats(last_message_at DESC, id DESC);

CREATE INDEX chat_messages_chat_id_created_at_id_desc_idx
    ON chat_messages(chat_id, created_at DESC, id DESC);

CREATE INDEX profiles_lower_name_user_id_idx
    ON profiles(lower(name), user_id);
