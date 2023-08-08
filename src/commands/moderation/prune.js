const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const { Argument } = require("discord-akairo");

class PruneCommand extends Command {
  constructor() {
    super("prune", {
      aliases: ["prune", "clean"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "limit",
          type: Argument.range("number", 1, 101),
          prompt: {
            start: "How many messages do you want to delete?",
            retry: "That... is not a valid number...? Enter a valid number...",
          },
        },
        {
          id: "user",
          match: "option",
          type: "member",
          flag: ["--user", "--users"],
        },
        {
          id: "role",
          match: "option",
          type: "role",
          flag: ["--role", "--roles"],
        },
        {
          id: "bot",
          match: "flag",
          flag: ["--bot", "--bots"],
        },
        {
          id: "invite",
          match: "flag",
          flag: ["--invite", "--invites"],
        },
        {
          id: "link",
          match: "flag",
          flag: ["--link", "--links"],
        },
        {
          id: "file",
          match: "flag",
          flag: ["--file", "--files", "--attachment", "--attachments"],
        },
      ],
      description: {
        content: `Locks a specified channel (or the current one if not specified) so that non-moderators cannot send messages.`,
        usage: "<Channel>",
        examples: ["general", "#general", "123123"],
      },
    });
    this.protected = false;
    this.whitelist = true;
  }

  userPermissions(message) {
    if (message.author.id === this.client.ownerID) return null;
    const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
    if (canBeRun === true) return null;
    return "NoPerms";
  }

  async exec(message, { limit, user, role, bot, invite, link, file }) {
    const pruneLimit = Math.floor(limit);
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    await message.delete();

    const messages = await message.channel.messages.fetch({ limit: pruneLimit });
    const filtered = await messages.filter((message) => {
      if (user === null && role === null && !bot && !invite && !link && !file) return message;
      if (user && message.author.id === user.id) return message;
      if (role && message.member && message.member.roles.cache.has(role.id)) return message;
      if (bot && message.author.bot) return message;
      if (invite && /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(message.content))
        return message;
      if (link && /https?:\/\/[^ /.]+\.[^ /.]+/.test(message.content)) return message;
      if (file && message.attachments.size > 0) return message;
    });

    await message.channel
      .bulkDelete(filtered, true)
      .catch(() =>
        webhook
          .send(`Some messages were not deleted due to being over 14 days old...`)
          .then((msg) => message.delete({ timeout: 3000 }))
      );
  }
}

module.exports = PruneCommand;
