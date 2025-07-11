import { defineCommand } from '../Command';
import { Message, Client, Embed } from 'oceanic.js';

export default defineCommand({
  name: 'avatar',
  aliases: ['av'],
  description: 'Shows the avatar of a user',
  async run(message: Message, args: string[]) {
    const client = message.client as Client;
    let user = message.author;

    const mention = message.content.match(/<@!?(\d+)>/);
    if (mention) {
      try {
        user = await client.rest.users.get(mention[1]);
      } catch {}
    } else if (args.length > 0) {
      const query = args.join(' ').toLowerCase();

      try {
        user = await client.rest.users.get(query);
      } catch {
        const member = message.guild?.members.find(
          (m) => m.user.username.toLowerCase() === query
        );
        if (member) user = member.user;
      }
    }

    const embed = {
      title: `${user.username}'s Avatar`,
      image: {
        url: user.avatarURL('png'),
      },
      color: 0x3498db,
    } satisfies Embed;

    await message.channel?.createMessage({ embeds: [embed] });
  },
});
