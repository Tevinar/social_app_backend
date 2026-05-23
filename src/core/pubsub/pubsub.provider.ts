import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PubSub } from '@google-cloud/pubsub';
import { EnvVariable } from '../config/env-variable';

/**
 * Nest dependency-injection token for the shared Google Pub/Sub client.
 */
export const PUBSUB_CLIENT = Symbol('PUBSUB_CLIENT');

/**
 * Factory-based Nest provider that creates one shared Pub/Sub client for the
 * application.
 */
export const pubsubProvider: Provider = {
  provide: PUBSUB_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): PubSub =>
    new PubSub({
      projectId: configService.getOrThrow<string>(
        EnvVariable.GoogleCloudProjectId,
      ),
    }),
};
