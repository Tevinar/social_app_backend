import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PubSubModule } from '../pubsub/pubsub.module';
import { OutboxPublisherService } from './outbox-publisher.service';

/**
 * Shared module that publishes transactional outbox rows to Pub/Sub.
 */
@Module({
  imports: [DatabaseModule, PubSubModule],
  providers: [OutboxPublisherService],
})
export class OutboxModule {}
