// src/commands/setch.ts
import { defineCommand } from '../Command';
import { reply } from '../utils';
import { prisma } from '../Prisma';

defineCommand({
  name: 'setch',
  description: 'jawa',
  ownerOnly: true,
  async run(message, args) {
    if (!message.guild?.id) return reply(message, 'Use this in a server.');
    const guildId = message.guild.id;

    const input = args[0]; 
    if (!input) return reply(message, 'Provide a channel ID or #mention');

    await prisma.announcementChannel.upsert({
      where: { guildId }, 
      update: { channelId: input },
      create: { guildId, channelId: input }, 
    });

    reply(message, `Announcement channel set to <#${input}>`);
  }
});
