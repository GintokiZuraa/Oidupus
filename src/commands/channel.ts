import { defineCommand } from "../Command";
import {
  Message,
  Permissions,
  Constants,
  AnyTextableChannel,
  EditPermissionOptions,
  AnyTextableGuildChannel,
  TextChannel,
  VoiceChannel,
  AnnouncementChannel,
  Uncached 
} from "oceanic.js";
import { prisma } from "../Prisma";

function isAdmin(member: { permissions: { has: (permission: bigint) => boolean } }): boolean {
  return member.permissions.has(Permissions.ADMINISTRATOR);
}

async function isChannelOwner(channelId: string, userId: string): Promise<boolean> {
  const owner = await prisma.channelOwner.findUnique({
    where: { channelId }
  });
  return owner?.userId === userId;
}

// Type guard to check if channel supports editing
function isEditableChannel(channel: AnyTextableGuildChannel): channel is TextChannel | VoiceChannel | AnnouncementChannel {
  return channel.type === Constants.ChannelTypes.GUILD_TEXT || 
         channel.type === Constants.ChannelTypes.GUILD_VOICE || 
         channel.type === Constants.ChannelTypes.GUILD_ANNOUNCEMENT;
}

export default defineCommand({
  name: "channel",
  aliases: ["ch"],
  description: "Channel management commands.  Available commands: slowmode, hide, unhide, add, remove",
  run: async (message: Message<AnyTextableChannel | Uncached>, args: string[]) => {
    if (!message.inCachedGuildChannel()) {
      return;
    }

    const { member, guild, channel } = message;

    if (!guild || !member || !channel) {
      return message.channel?.createMessage({ content: "This command can only be used in a server." });
    }

    const reply = (content: string) => message.channel.createMessage({ content });

    const [subcommand, ...rest] = args;

    switch (subcommand?.toLowerCase()) {
      case "create": {
        if (!isAdmin(member)) {
          return reply("Only administrators can use this command.");
        }
        
        const [name, userMention] = rest;
        if (!name || !userMention) {
          return reply("Usage: ?ch create <name> <@user>");
        }

        const userId = userMention.replace(/[<@!>]/g, "");
        
        try {
          const user = await guild.getMember(userId);
          if (!user) {
            return reply("Invalid user mentioned.");
          }

          const categoryId = "1376106554654330953";

          
          if (!categoryId) {
            return reply("Category 'user-channels' not found.");
          }

          const options = {
            name,
            parentID: categoryId,
            permissionOverwrites: [
              {
                id: guild.id,
                deny: Permissions.VIEW_CHANNEL,
                type: Constants.OverwriteTypes.ROLE,
              },
              {
                id: user.id,
                allow: [
                  Permissions.VIEW_CHANNEL,
                  Permissions.SEND_MESSAGES,
                  Permissions.MANAGE_MESSAGES,
                  Permissions.MANAGE_CHANNELS,
                  Permissions.READ_MESSAGE_HISTORY,
                ].reduce((a, b) => a | b, 0n),
                type: Constants.OverwriteTypes.MEMBER,
              },
            ],
          };

          const newChannel = await guild.createChannel(Constants.ChannelTypes.GUILD_TEXT, options);

          await prisma.channelOwner.create({
            data: {
              channelId: newChannel.id,
              userId: user.id,
            },
          });

          return reply(`Created channel <#${newChannel.id}> for <@${user.id}>`);
        } catch (error) {
          console.error(error);
          return reply("Failed to create channel or find user.");
        }
      }

      case "slowmode": {
        if (!await isChannelOwner(channel.id, message.author.id)) {
          return reply("Use the command in your channel!");
        }
        
        const seconds = parseInt(rest[0]);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
          return reply("Please enter a number jawa");
        }
        
        if (!isEditableChannel(channel)) {
          return reply("This channel type doesn't support slowmode.");
        }
        
        try {
          await channel.edit({
            rateLimitPerUser: seconds
          });
          return reply(`Slowmode set to ${seconds} seconds.`);
        } catch (error) {
          console.error(error);
          return reply("Failed to set slowmode.");
        }
      }

      case "hide": {
        if (!await isChannelOwner(channel.id, message.author.id)) {
          return reply("Use the command in your channel!");
        }
        
        if (!isEditableChannel(channel)) {
          return reply("This channel type doesn't support permission editing.");
        }
        
        try {
          const options: EditPermissionOptions = {
            deny: Permissions.VIEW_CHANNEL,
            type: Constants.OverwriteTypes.ROLE,
          };
          await channel.editPermission(guild.id, options);
          return reply("Channel hidden from others.");
        } catch (error) {
          console.error(error);
          return reply("Failed to hide channel.");
        }
      }

      case "unhide": {
        if (!await isChannelOwner(channel.id, message.author.id)) {
          return reply("Use the command in your channel!");
        }
        
        if (!isEditableChannel(channel)) {
          return reply("This channel type doesn't support permission editing.");
        }
        
        try {
          const options: EditPermissionOptions = {
            allow: Permissions.VIEW_CHANNEL,
            type: Constants.OverwriteTypes.ROLE,
          };
          await channel.editPermission(guild.id, options);
          return reply("Channel is now visible to everyone.");
        } catch (error) {
          console.error(error);
          return reply("Failed to unhide channel.");
        }
      }

      case "add": {
        if (!await isChannelOwner(channel.id, message.author.id)) {
          return reply("Use the command in your channel!");
        }
        
        const userId = rest[0]?.replace(/[<@!>]/g, "");
        if (!userId) {
          return reply("Usage: ?ch add <@user>");
        }
        
        if (!isEditableChannel(channel)) {
          return reply("This channel type doesn't support permission editing.");
        }
        
        try {
          const options: EditPermissionOptions = {
            allow: [
              Permissions.VIEW_CHANNEL,
              Permissions.SEND_MESSAGES,
            ].reduce((a, b) => a | b, 0n),
            type: Constants.OverwriteTypes.MEMBER,
          };
          await channel.editPermission(userId, options);
          return reply(`Added user <@${userId}> to the channel.`);
        } catch (error) {
          console.error(error);
          return reply("Failed to add user to channel.");
        }
      }
    
      case "transfer": {
  if (!await isChannelOwner(channel.id, message.author.id)) {
    return reply("You must use this command in your own channel.");
  }

  const newOwnerMention = rest[0];
  if (!newOwnerMention) {
    return reply("Usage: ?ch transfer <@user>");
  }

  const newOwnerId = newOwnerMention.replace(/[<@!>]/g, "");

  try {
    const newOwner = await guild.getMember(newOwnerId);
    if (!newOwner) {
      return reply("Invalid user mentioned.");
    }

    if (!isEditableChannel(channel)) {
      return reply("This channel type doesn't support permission editing.");
    }

    // Remove old owner permissions
    const oldOwnerId = message.author.id;
    await channel.editPermission(oldOwnerId, {
      deny: [
        Permissions.MANAGE_MESSAGES,
        Permissions.MANAGE_CHANNELS,
      ].reduce((a, b) => a | b, 0n),
      allow: [Permissions.VIEW_CHANNEL, Permissions.SEND_MESSAGES].reduce((a, b) => a | b, 0n),
      type: Constants.OverwriteTypes.MEMBER,
    });

    // Grant new owner permissions
    await channel.editPermission(newOwnerId, {
      allow: [
        Permissions.VIEW_CHANNEL,
        Permissions.SEND_MESSAGES,
        Permissions.MANAGE_MESSAGES,
        Permissions.MANAGE_CHANNELS,
        Permissions.READ_MESSAGE_HISTORY,
      ].reduce((a, b) => a | b, 0n),
      type: Constants.OverwriteTypes.MEMBER,
    });

    // Update ownership in the database
    await prisma.channelOwner.update({
      where: { channelId: channel.id },
      data: { userId: newOwnerId },
    });

    return reply(`Transferred channel ownership to <@${newOwnerId}>.`);
  } catch (error) {
    console.error(error);
    return reply("Failed to transfer channel ownership.");
  }
}

    case "delete": {
  if (!isAdmin(member)) {
    return reply("Only administrators can use this command.");
  }

  const channelMentionOrId = rest[0];
  if (!channelMentionOrId) {
    return reply("Usage: ?ch delete <#channel | channel_id>");
  }

  const channelId = channelMentionOrId.replace(/[<#>]/g, "");
  const targetChannel = guild.channels.get(channelId);

  if (!targetChannel) {
    return reply("Channel not found.");
  }

  try {
    await targetChannel.delete();
    await prisma.channelOwner.deleteMany({ where: { channelId } }); // Optional cleanup
    return reply(`Deleted channel <#${channelId}>.`);
  } catch (error) {
    console.error(error);
    return reply("Failed to delete the channel.");
  }
}


      default:
        return reply("Unknown subcommand. Available commands: slowmode, hide, unhide, add, remove, transfer");
    }
  },
});