import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth, type AuthClient } from 'google-auth-library';
import { Kafka, type KafkaConfig, logLevel, type SASLOptions } from 'kafkajs';
import { EnvVariable } from '../config/env-variable';

/**
 * Nest dependency-injection token for the shared KafkaJS client.
 */
export const KAFKA_CLIENT = Symbol('KAFKA_CLIENT');

const GOOGLE_CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform';

/**
 * The Kafka protocol modes a client can use to connect to the cluster in this application:
 * - `PLAINTEXT`: No encryption or authentication.
 * - `SASL_SSL`: Authentication with TLS encryption and Google
 *   `SASL/OAUTHBEARER`.
 */
type KafkaSecurityProtocol = 'PLAINTEXT' | 'SASL_SSL';

type KafkaOauthBearerSaslOptions = Extract<
  SASLOptions,
  { mechanism: 'oauthbearer' }
>;

/**
 * Factory-based Nest provider that creates one shared KafkaJS client for the
 * application.
 */
export const kafkaProvider: Provider = {
  provide: KAFKA_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Kafka =>
    new Kafka(getKafkaConfig(configService)),
};

/**
 * Builds the KafkaJS client configuration from environment values.
 *
 * @param configService Shared Nest config service.
 * @returns KafkaJS client configuration.
 */
function getKafkaConfig(configService: ConfigService): KafkaConfig {
  const brokers = configService
    .getOrThrow<string>(EnvVariable.KafkaBootstrapServers)
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);
  const protocol = getKafkaSecurityProtocol(configService);
  const usesSsl = protocol === 'SASL_SSL';
  const sasl = getKafkaSaslOptions(protocol);

  return {
    brokers,
    clientId: 'social-app-backend',
    ssl: usesSsl,
    ...(sasl ? { sasl } : {}),
    logLevel: logLevel.ERROR,
  };
}

/**
 * Resolves the transport security mode used for Kafka connections.
 *
 * @param configService Shared Nest config service.
 * @returns Normalized Kafka security protocol.
 */
function getKafkaSecurityProtocol(
  configService: ConfigService,
): KafkaSecurityProtocol {
  const protocol =
    configService.get<string>(EnvVariable.KafkaSecurityProtocol) ?? 'PLAINTEXT';

  switch (protocol) {
    case 'PLAINTEXT':
    case 'SASL_SSL':
      return protocol;
    default:
      throw new Error(`Unsupported Kafka security protocol: ${protocol}`);
  }
}

/**
 * Builds SASL options when the configured protocol requires authentication.
 *
 * @param protocol Kafka security protocol currently in use.
 * @returns SASL options for KafkaJS, or `undefined` when SASL is disabled.
 */
function getKafkaSaslOptions(
  protocol: KafkaSecurityProtocol,
): KafkaOauthBearerSaslOptions | undefined {
  if (protocol !== 'SASL_SSL') {
    return undefined;
  }

  const googleAuth = new GoogleAuth({
    scopes: GOOGLE_CLOUD_PLATFORM_SCOPE,
  });
  const authClientPromise = googleAuth.getClient();

  return {
    mechanism: 'oauthbearer',
    oauthBearerProvider: async () => ({
      value: await getGoogleAccessToken(authClientPromise),
    }),
  };
}

/**
 * Resolves an ADC-backed OAuth access token for Google Managed Kafka.
 *
 * @param authClientPromise Shared Google auth client promise.
 * @returns Non-empty OAuth bearer token value.
 */
async function getGoogleAccessToken(
  authClientPromise: Promise<AuthClient>,
): Promise<string> {
  const authClient = await authClientPromise;
  const { token } = await authClient.getAccessToken();

  if (!token) {
    throw new Error(
      'Google ADC did not return an access token for Kafka OAUTHBEARER authentication.',
    );
  }

  return token;
}
