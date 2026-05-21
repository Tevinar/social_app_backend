import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxPublisherService } from './outbox-publisher.service';

/**
 * Shared module that publishes transactional outbox rows to Kafka.
 */
@Module({
  imports: [DatabaseModule, KafkaModule],
  providers: [OutboxPublisherService],
})
export class OutboxModule {}
