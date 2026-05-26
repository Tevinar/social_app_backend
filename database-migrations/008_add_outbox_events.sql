create table outbox_events (
    id uuid primary key,
    aggregate_type text not null,
    aggregate_id text not null,
    event_type text not null,
    topic text not null,
    message_key text,
    payload text not null,
    created_at timestamptz not null default now(),
    next_attempt_at timestamptz not null default now(),
    published_at timestamptz,
    attempts integer not null default 0,
    last_error text
);

create index outbox_events_due_idx
    on outbox_events(next_attempt_at asc, created_at asc, id asc)
    where published_at is null;
