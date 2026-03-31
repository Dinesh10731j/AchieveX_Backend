import { closeQueueConnections } from '../config/bullmq';
import { closeRedisConnections } from '../config/redis';

afterAll(async () => {
  await Promise.allSettled([closeQueueConnections(), closeRedisConnections()]);
});
