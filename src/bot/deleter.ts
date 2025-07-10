import { debug, error, info } from 'src/logger';

let numDeletedMessages = 0;

export function continuallyDeleteReadyMessages(): void {
  setTimeout(() => {
    deleteReadyMessages()
      .then(() => continuallyDeleteReadyMessages())
      .catch((err: any) => {
        error('[bot/deleter] Encountered a fatal error in the message deleter:', err);
        process.exit(1);
      });
  }, 5000);
}

async function deleteReadyMessages(): Promise<void> {
  debug('[bot/deleter] Running deleteReadyMessages()...');
  numDeletedMessages = 0;
  const startTime = Date.now();
  await retrieveAndDeleteReadyMessages();
  const durationInSec = Math.round((Date.now() - startTime + Number.EPSILON) * 100) / 100000;
  if (numDeletedMessages === 0) {
    debug(`[bot/deleter] No deletable messages were found (duration: ${durationInSec}s)`);
  } else {
    info(
      `[bot/deleter] Successfully deleted ${numDeletedMessages} message${numDeletedMessages !== 1 ? 's' : ''}`,
      `(duration: ${durationInSec}s)`,
    );
  }
}

async function retrieveAndDeleteReadyMessages(): Promise<void> {
  // TODO
  return Promise.resolve();
}
