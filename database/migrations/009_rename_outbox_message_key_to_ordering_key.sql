alter table outbox_events
    rename column message_key to ordering_key;

alter table outbox_events
    alter column ordering_key set not null;
