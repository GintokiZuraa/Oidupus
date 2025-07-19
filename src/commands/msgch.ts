import { defineCommand } from '../Command';
import { reply } from '../utils';
import { prisma } from '../Prisma';

defineCommand({
  name: 'msgsend',
  description: 'Send a message to all announcement channels',
  aliases: ['announce', 'sendch'],
  usages: ['<text>'],
  ownerOnly: true,
  async run(message, args) {
    const client = message.client;

    const content = args.join(' ');
    if (!content) return reply(message, 'Please provide a message to send.');

    const channelDataList = await prisma.announcementChannel.findMany();
    if (!channelDataList.length) {
      return reply(message, 'No announcement channels registered.');
    }

    for (const channelData of channelDataList) {
      try {
        const targetChannel = await client.rest.channels.get(channelData.channelId);
        if (!targetChannel || !('createMessage' in targetChannel)) continue;

        await targetChannel.createMessage({ content });
      } catch (err) {
        console.error(`Failed to send to ${channelData.channelId}:`, err);
      }
    }

    return reply(message, 'Message sent to all registered announcement channels.');
  }
});
