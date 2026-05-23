import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PubSubRuntimeService } from '../pubsub/pubsub-runtime.service';

const OUTBOX_POLL_INTERVAL_MS = 1_000;
const OUTBOX_BATCH_SIZE = 50;
const OUTBOX_CLAIM_LEASE_MS = 30_000;
const OUTBOX_MAX_LAST_ERROR_LENGTH = 2_000;
const OUTBOX_RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 300_000, 900_000];

type ClaimedOutboxEvent = {
  id: string;
  topic: string;
  messageKey: string | null;
  payload: string;
  attempts: number;
};

/**
 * Background worker that publishes durable outbox rows to Pub/Sub and retries
 * transient failures with backoff.
 */
@Injectable()
export class OutboxPublisherService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(OutboxPublisherService.name);

  private interval: NodeJS.Timeout | null = null;
  private isFlushInProgress = false;

  /**
   * Receives the shared database and Pub/Sub runtime services.
   *
   * @param database Shared Postgres service.
   * @param pubsubRuntime Shared Pub/Sub runtime used for publishing.
   */
  constructor(
    private readonly database: DatabaseService,
    private readonly pubsubRuntime: PubSubRuntimeService,
  ) {}

  /**
   * Starts the periodic outbox polling loop after the application has fully
   * bootstrapped.
   */
  onApplicationBootstrap(): void {
    this.interval = setInterval(() => {
      void this.flushDueEvents();
    }, OUTBOX_POLL_INTERVAL_MS);

    this.interval.unref?.();

    void this.flushDueEvents();
  }

  /**
   * Stops the background polling loop during Nest shutdown.
   */
  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Claims one batch of due outbox rows and publishes them sequentially.
   */
  private async flushDueEvents(): Promise<void> {
    if (this.isFlushInProgress) {
      return;
    }

    this.isFlushInProgress = true;

    try {
      const events = await this.claimDueEvents();

      for (const event of events) {
        await this.publishClaimedEvent(event);
      }
    } catch (error) {
      this.logger.error(
        `Outbox flush failed: ${this.toErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isFlushInProgress = false;
    }
  }

  /**
   * Claims one retry-safe batch of due outbox rows by moving their
   * `next_attempt_at` lease into the future.
   *
   * @returns Claimed rows ready for publication.
   */
  private async claimDueEvents(): Promise<ClaimedOutboxEvent[]> {
    const claimedUntil = new Date(Date.now() + OUTBOX_CLAIM_LEASE_MS);

    return this.database.sql.begin(async (sql) => {
      return sql<ClaimedOutboxEvent[]>`
        with due_events as (
          select id
          from outbox_events
          where published_at is null
            and next_attempt_at <= now()
          order by created_at asc, id asc
          limit ${OUTBOX_BATCH_SIZE}
          for update skip locked
        )
        update outbox_events as oe
        set
          attempts = oe.attempts + 1,
          next_attempt_at = ${claimedUntil}
        from due_events
        where oe.id = due_events.id
        returning
          oe.id,
          oe.topic,
          oe.message_key as "messageKey",
          oe.payload,
          oe.attempts
      `;
    });
  }

  /**
   * Publishes one claimed outbox row and marks it as published or retriable.
   *
   * @param event Claimed outbox row.
   */
  private async publishClaimedEvent(event: ClaimedOutboxEvent): Promise<void> {
    try {
      const message =
        event.messageKey === null
          ? {
              topic: event.topic,
              value: event.payload,
            }
          : {
              topic: event.topic,
              key: event.messageKey,
              value: event.payload,
            };

      await this.pubsubRuntime.send(message);

      await this.markEventPublished(event.id);
    } catch (error) {
      await this.markEventFailed(event.id, event.attempts, error);

      this.logger.warn(
        `Outbox publish failed for ${event.id}: ${this.toErrorMessage(error)}`,
      );
    }
  }

  /**
   * Marks one outbox row as successfully published.
   *
   * @param outboxEventId Published row id.
   */
  private async markEventPublished(outboxEventId: string): Promise<void> {
    await this.database.sql`
      update outbox_events
      set
        published_at = now(),
        last_error = null
      where id = ${outboxEventId}::uuid
    `;
  }

  /**
   * Schedules the next retry window and stores the last publication error.
   *
   * @param outboxEventId Failed row id.
   * @param attempts Current attempt count after claiming the row.
   * @param error Last Pub/Sub publication error.
   */
  private async markEventFailed(
    outboxEventId: string,
    attempts: number,
    error: unknown,
  ): Promise<void> {
    const nextAttemptAt = new Date(Date.now() + this.getRetryDelayMs(attempts));

    await this.database.sql`
      update outbox_events
      set
        next_attempt_at = ${nextAttemptAt},
        last_error = ${this.toErrorMessage(error).slice(
          0,
          OUTBOX_MAX_LAST_ERROR_LENGTH,
        )}
      where id = ${outboxEventId}::uuid
    `;
  }

  /**
   * Returns the retry delay for one failed publication attempt.
   *
   * @param attempts Current attempt count.
   * @returns Retry delay in milliseconds.
   */
  private getRetryDelayMs(attempts: number): number {
    const scheduleIndex = Math.min(
      Math.max(attempts - 1, 0),
      OUTBOX_RETRY_DELAYS_MS.length - 1,
    );

    return OUTBOX_RETRY_DELAYS_MS[scheduleIndex] ?? 900_000;
  }

  /**
   * Converts an unknown error into a stable loggable message.
   *
   * @param error Unknown error value.
   * @returns Human-readable error message.
   */
  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (
      typeof error === 'string' ||
      typeof error === 'number' ||
      typeof error === 'boolean' ||
      typeof error === 'bigint'
    ) {
      return String(error);
    }

    if (error === null || error === undefined) {
      return 'Unknown outbox publish error';
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown outbox publish error';
    }
  }
}
