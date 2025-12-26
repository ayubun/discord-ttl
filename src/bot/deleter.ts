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
  /**
   * - iterate over the servers:
   *   - get global user settings; store in a map of userId -> user settings
   *   - get all user server settings; make new map of userId -> user server settings (merging any global user settings)
   *   - get server settings
   *   - iterate over the channels:
   *     - get server channel settings
   *     - get user server channel settings; merge into new map of userId -> user server channel settings (merging any global or server user settings)
   *     - for each unique user in the set:
   *       - create an effective user server channel settings object
   *       - query for message ids that are ready to be deleted via the effectiveTtl, with a limit of 100 (max bulk delete)
   *       - run the delete for this server/channel/user combination
   *       - update the message ids table to remove the deleted messages
   *     - now, create an effective server channel settings object for the server channel ttl, providing default user settings
   *     - query for message ids that are ready to be deleted via the effectiveTtl, with a limit of 100 (max bulk delete)
   *       - use a WHERE clause that excludes author_ids that are within the set of users that have a user server channel settings
   *     - run the delete for this server/channel combination
   */
  return Promise.resolve();
}
