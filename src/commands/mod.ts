import { defineCommand } from '../Command';
import {
  Message,
  AnyTextableChannel,
  TextChannel,
  Guild,
  Uncached
} from 'oceanic.js';

const MODLOG_CHANNEL_ID = 'YOUR_MODLOG_CHANNEL_ID'; // Replace with your modlog channel ID
const MUTE_ROLE_ID = 'YOUR_MUTE_ROLE_ID'; // Replace with your mute role ID

async function logToModlog(guild: Guild, content: string) {
  const channel = guild.channels.get(MODLOG_CHANNEL_ID);
  if (channel?.type === 0) {
    await (channel as TextChannel).createMessage({ content });
  }
}

export default defineCommand({
  name: 'mod',
  description: 'Moderation commands: ?mod ban|kick|mute|unmute <@user> [reason]',
  ownerOnly: true,
  async run(message: Message<AnyTextableChannel | Uncached>, args: string[]) {
    if (!message.inCachedGuildChannel()) return;

    const { member, guild } = message;
    const reply = (text: string) => message.channel.createMessage({ content: text });

    const [subcommand, mention, ...rest] = args;
    const userId = mention?.replace(/[<@!>]/g, '');
    if (!subcommand || !userId) return reply('Usage: `?mod ban|kick|mute|unmute <@user> [reason]`');

    const reason = rest.join(' ') || 'No reason provided.';
    const target = await guild.getMember(userId).catch(() => null);
    if (!target) return reply('User not found.');

    switch (subcommand.toLowerCase()) {
      case 'ban': {
        try {
          await target.ban({ reason });
          await reply(` Banned <@${userId}>.`);
          await logToModlog(guild, ` **Ban** — <@${userId}> banned by <@${member.id}>\n Reason: ${reason}`);
        } catch (err) {
          console.error(err);
          reply('Ban failed.');
        }
        break;
      }

      case 'kick': {
        try {
          await target.kick(reason);
          await reply(` Kicked <@${userId}>.`);
          await logToModlog(guild, ` **Kick** — <@${userId}> kicked by <@${member.id}>\n Reason: ${reason}`);
        } catch (err) {
          console.error(err);
          reply('Kick failed.');
        }
        break;
      }

      case 'mute': {
        if (!MUTE_ROLE_ID) return reply('Mute role ID is not set.');
        try {
          if ((target.roles as string[]).includes(MUTE_ROLE_ID)) {
            return reply('User is already muted.');
          }

          await target.addRole(MUTE_ROLE_ID);
          await reply(` Muted <@${userId}>.`);
          await logToModlog(guild, ` **Mute** — <@${userId}> muted by <@${member.id}>\n Reason: ${reason}`);
        } catch (err) {
          console.error(err);
          reply('Mute failed.');
        }
        break;
      }

      case 'unmute': {
        if (!MUTE_ROLE_ID) return reply('Mute role ID is not set.');
        try {
          if (!(target.roles as string[]).includes(MUTE_ROLE_ID)) {
            return reply('User is not muted.');
          }

          await target.removeRole(MUTE_ROLE_ID);
          await reply(` Unmuted <@${userId}>.`);
          await logToModlog(guild, ` **Unmute** — <@${userId}> unmuted by <@${member.id}>\n📄 Reason: ${reason}`);
        } catch (err) {
          console.error(err);
          reply('Unmute failed.');
        }
        break;
      }

      default:
        return reply('Unknown subcommand. Use `ban`, `kick`, `mute`, or `unmute`.');
    }
  }
});
