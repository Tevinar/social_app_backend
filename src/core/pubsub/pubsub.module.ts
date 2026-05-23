import { Module } from '@nestjs/common';
import { PUBSUB_CLIENT, pubsubProvider } from './pubsub.provider';
import { PubSubRuntimeService } from './pubsub-runtime.service';

/**
 * Shared Pub/Sub module that registers and exports the configured client plus
 * the shared publishing/subscription runtime.
 */
@Module({
  providers: [pubsubProvider, PubSubRuntimeService],
  exports: [PUBSUB_CLIENT, PubSubRuntimeService],
})
export class PubSubModule {}
