const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const PremiumUsers = require("../../models/PremiumUsers");

class SetPingReactionCommand extends Command {
  constructor() {
    super("set-ping-reaction", {
      aliases: ["set-ping-reaction", "set-mention-reaction", "set-reaction", "set-ping", "set-mention"],
      category: "premium",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "emoji",
          type: "validEmoji",
          prompt: {
            start: "What should the bot reply with when you are pinged?",
            retry: (message, { failure }) => `${failure.value} Try again...`,
          },
        },
      ],
      description: {
        content: `Sets an emoji to be used for a reaction that is added to messages you are mentioned in. Emoji but be accessible by the bot and not from private servers.`,
        usage: "<emoji>",
        examples: ["<:smile:>", "<:kekw:>"],
      },
    });
    this.protected = false;
    this.whitelist = true;
  }

  userPermissions(message) {
    const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
    if (canBeRun === true) return null;
    return "NoPerms";
  }

  async exec(message, { emoji }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Kana");

    const premiumUser = await PremiumUsers.findOne({ where: { userID: message.author.id } });
    if (!premiumUser) {
      await PremiumUsers.create({
        userID: message.author.id,
        startDate: new Date(),
        endDate: new Date(),
        currentPledge: 0,
        lifetimePledge: 0,
        pledgeSource: "temp",
        isAFK: false,
        afkMessage: null,
        mentionEmoji: emoji.identifier || emoji,
      });
      await message.react(emoji);
      return webhook.send(`Done! c:`).then((message) => message.delete({ timeout: 3000 }));
    }

    premiumUser.mentionEmoji = emoji.identifier || emoji;
    await premiumUser.save();
    await message.react(emoji);
    return webhook.send(`Done c:`).then((message) => message.delete({ timeout: 3000 }));
  }
}

module.exports = SetPingReactionCommand;
