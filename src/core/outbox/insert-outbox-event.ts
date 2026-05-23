import { type TransactionSql } from 'postgres';
import { type DatabaseClient } from '../database/database.provider';
import { type OutboxEventRecord } from './outbox-event-record';

/**
 * Persists one outbox row inside the caller's current SQL transaction.
 *
 * @param sql Transaction-scoped Postgres client.
 * @param event Durable outbox event to insert.
 */
export async function insertOutboxEvent(
  sql: DatabaseClient | TransactionSql,
  event: OutboxEventRecord,
): Promise<void> {
  await sql`
    insert into outbox_events (
      id,
      aggregate_type,
      aggregate_id,
      event_type,
      topic,
      ordering_key,
      payload
    )
    values (
      ${event.id}::uuid,
      ${event.aggregateType},
      ${event.aggregateId},
      ${event.eventType},
      ${event.topic},
      ${event.orderingKey},
      ${event.payload}
    )
  `;
}
