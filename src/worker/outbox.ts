import { db } from "../utils/db";
import { queue } from "./queue";

export async function publishOutboxMessages() {
  // Retry messages that were saved but not published to Redis.
  const messages = await db.orm.public.OutboxMessage
    .where((message) => message.status.eq("PENDING"))
    .all();

  for (const message of messages) {
    try {
      await queue.add(message.type, JSON.parse(message.payload));

      // Mark the message only after Redis accepts it.
      await db.orm.public.OutboxMessage
        .where((outboxMessage) => outboxMessage.id.eq(message.id))
        .update({ status: "SENT" });
    } catch (error) {
      console.error(`Failed to publish outbox message ${message.id}:`, error);
    }
  }
}