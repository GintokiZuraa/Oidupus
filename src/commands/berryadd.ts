import { defineCommand } from '../Command';
import { Message } from 'oceanic.js';
import { logBerryProgress } from '../modules/berryLogger';

export default defineCommand({
  name: 'berryadd',
  description: 'Add a berry progression log',
  aliases: ['ba'],
  ownerOnly: true,
  run: async (message: Message) => {
    const args = message.content.split(' ').slice(1);
    if (args.length < 2) {
      return message.channel?.createMessage({
        content: 'Usage: ?berryadd <epicness> <berry remaining> [breeds before level up] [proof link]'
      });
    }

    const epicness = parseInt(args[0], 10);
    const berry = parseInt(args[1], 10);
    const breeds = args[2] ? parseInt(args[2], 10) : 'forgor';
    const proofLink = args[3] ? args.slice(3).join(' ') : 'forgor';

    if (isNaN(epicness) || isNaN(berry)) {
      return message.channel?.createMessage({
        content: 'Epicness and berry remaining must be numbers.'
      });
    }

    try {
      await logBerryProgress(epicness, berry, breeds, proofLink);
      await message.channel?.createMessage({
        content: 'Berry progression logged successfully.'
      });
    } catch (err) {
      console.error('[berryadd error]', err);
      await message.channel?.createMessage({
        content: 'Failed to log berry progression. Check logs.'
      });
    }
  }
});
