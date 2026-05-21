import { Module } from '@nestjs/common';
import { KafkaRuntimeService } from './kafka-runtime.service';
import { KAFKA_CLIENT, kafkaProvider } from './kafka.provider';

/**
 * Shared Kafka module that registers and exports the configured KafkaJS client
 * plus the shared producer/consumer runtime.
 */
@Module({
  providers: [kafkaProvider, KafkaRuntimeService],
  exports: [KAFKA_CLIENT, KafkaRuntimeService],
})
export class KafkaModule {}
