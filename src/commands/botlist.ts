import { defineCommand } from '../Command';
import { Message } from 'oceanic.js';

export default defineCommand({
    name: 'listbots',
    description: 'List all bots in this server.',
    ownerOnly: true,
    run: async (message: Message) => {
        const guild = message.guild;
        if (!guild) return;

        // Fetch all members to ensure full list is available
        await guild.fetchMembers();

        // Filter bots from cached members
        const bots = guild.members.filter(member => member.user?.bot);

        if (bots.length === 0) {
            return message.channel?.createMessage({
                content: 'No bots found in this server.'
            });
        }

        const list = bots
            .map(bot => `• **${bot.user.username}** \`(${bot.user.id})\``)
            .join('\n')
            .slice(0, 1900); // keep message under 2000 character limit

        return message.channel?.createMessage({
            content: `**Bots in this server:**\n${list}`
        });
    }
});
