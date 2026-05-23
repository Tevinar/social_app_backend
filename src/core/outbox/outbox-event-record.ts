/**
 * One durable event awaiting publication from the transactional outbox.
 */
export type OutboxEventRecord = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  topic: string;
  orderingKey: string;
  payload: string;
};
