// the backfiller handles collection of message ids from discord and storing them in the database.
// this is important so that discord ttl can query for user-specific ttls. it also saves on api calls.

// let numBackfilledMessages = 0;

// export async function continuallyBackfillMessages(): Promise<void> {
//   while (true) {
//     debug('[bot/backfiller] Running continuallyBackfillMessages()...');
//     numBackfilledMessages = 0;
//     const startTime = Date.now();
//     await retrieveAndDeleteMessages();
//     const durationInSec = Math.round((Date.now() - startTime + Number.EPSILON) * 100) / 100000;
//     if (numBackfilledMessages === 0) {
//       debug(`[bot/backfiller] No backfillable messages were found (duration: ${durationInSec}s)`);
//     } else {
//       info(
//         `[bot/backfiller] Successfully backfilled ${numBackfilledMessages} message${
//           numTotalDeletedMessages !== 1 ? 's' : ''
//         }`,
//         `(duration: ${durationInSec}s)`,
//       );
//     }
//     if (durationInSec < 10) {
//       await sleep(1000 * (10 - durationInSec)); // wait at least 10 seconds per retrieval loop (why not :3)
//     }
//   }
// }
