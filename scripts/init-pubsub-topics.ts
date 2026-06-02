import { config as loadEnv } from 'dotenv';
import { PubSub } from '@google-cloud/pubsub';
import { requireEnv } from './helpers/require-env';
import {
  CHAT_LIST_TOPIC_NAME,
  CHAT_MESSAGE_LIST_TOPIC_NAME,
} from '../src/core/pubsub/topic-names';

const CHAT_TOPICS = [
  CHAT_LIST_TOPIC_NAME,
  CHAT_MESSAGE_LIST_TOPIC_NAME,
] as const;

/**
 * Loads the local backend runtime configuration from the tracked `.env` file.
 */
function loadRuntimeEnv(): void {
  loadEnv({ path: '.env' });
}

/**
 * Ensures the local or remote Pub/Sub project contains the realtime topics the
 * backend expects at runtime.
 */
async function main(): Promise<void> {
  loadRuntimeEnv();

  const pubsub = new PubSub({
    projectId: requireEnv('GOOGLE_CLOUD_PROJECT_ID'),
  });

  try {
    for (const topicName of CHAT_TOPICS) {
      const topic = pubsub.topic(topicName);
      const [exists] = await topic.exists();

      if (!exists) {
        await topic.create();
      }

      console.log(`ready: ${topicName}`);
    }
  } finally {
    await pubsub.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
