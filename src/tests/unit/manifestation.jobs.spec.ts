import { scheduleManifestationJobs } from '../../queues/jobs/manifestation.jobs';

const reminderAdd = jest.fn();
const deadlineAdd = jest.fn();
const isBullMQReady = jest.fn(() => true);

jest.mock('../../config/bullmq', () => ({
  reminderQueue: { add: (...args: unknown[]) => reminderAdd(...args) },
  deadlineQueue: { add: (...args: unknown[]) => deadlineAdd(...args) },
  isBullMQReady: () => isBullMQReady()
}));

describe('scheduleManifestationJobs', () => {
  beforeEach(() => {
    reminderAdd.mockReset();
    deadlineAdd.mockReset();
    isBullMQReady.mockReturnValue(true);
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-31T00:00:00.000Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('schedules reminders and deadline+5d finalization job', async () => {
    const deadline = new Date('2026-04-02T00:00:00.000Z');
    await scheduleManifestationJobs('goal-1', deadline);

    expect(reminderAdd).toHaveBeenCalledTimes(2);
    expect(deadlineAdd).toHaveBeenCalledTimes(1);

    const deadlineCall = deadlineAdd.mock.calls[0];
    expect(deadlineCall[2]).toMatchObject({
      jobId: 'goal:goal-1:deadline-plus-5d',
      delay: 7 * 24 * 60 * 60 * 1000
    });
  });

  it('skips scheduling when bullmq is not ready', async () => {
    isBullMQReady.mockReturnValue(false);

    const deadline = new Date('2026-04-02T00:00:00.000Z');
    await scheduleManifestationJobs('goal-2', deadline);

    expect(reminderAdd).not.toHaveBeenCalled();
    expect(deadlineAdd).not.toHaveBeenCalled();
  });
});
