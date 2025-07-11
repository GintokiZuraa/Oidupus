import { client } from '../Client';

let lastStickyMessageId: string | null = null;
const CHANNEL_IDS = ['1375202232882167839', '1375229336134615090', '1375229362042962022']; // replace with actual channel IDs
const STICKY_CONTENT = '🔔 Don’t forget to check your quests and claim rewards! 🔔';
const lastStickyMessages: Record<string, string | null> = {
    'CHANNEL_ID_1': null,
    'CHANNEL_ID_2': null,
    'CHANNEL_ID_3': null
};

setInterval(async () => {
    for (const channelId of CHANNEL_IDS) {
        try {
            const channel = await client.rest.channels.get(channelId);
            if (!channel || channel.type !== 0) continue; // Skip if not a text channel

            // Delete previous sticky message if exists
            const lastMessageId = lastStickyMessages[channelId];
            if (lastMessageId) {
                try {
                    await client.rest.channels.deleteMessage(channelId, lastMessageId);
                } catch (err) {
                    console.warn(`Could not delete previous sticky message in ${channelId}:`, err);
                }
            }

            // Send new sticky message
            const newMsg = await client.rest.channels.createMessage(channelId, {
                content: STICKY_CONTENT
            });

            lastStickyMessages[channelId] = newMsg.id;

        } catch (err) {
            console.error(`Failed to send sticky message to ${channelId}:`, err);
        }
    }
}, 30 * 60 * 1000); // 30 minutes


