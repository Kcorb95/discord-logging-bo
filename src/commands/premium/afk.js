const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const PremiumUsers = require("../../models/PremiumUsers");

class ToggleAFKCommand extends Command {
  constructor() {
    super("toggle-afk", {
      aliases: ["toggle-afk", "afk"],
      category: "premium",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "afkMessage",
          type: "string",
          prompt: {
            start: "What should the bot reply with when you are pinged?",
            retry: "That's some how not text?? Please enter valid text...",
            optional: true,
          },
        },
      ],
      description: {
        content: `Marks yourself as AFK in the current server so people are notified when you are pinged. You may also include an AFK message.`,
        usage: "<reason>",
        examples: ["<nothing>", "BRB walking dog..."],
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

  async exec(message, { afkMessage }) {
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
        isAFK: true,
        afkMessage: afkMessage,
      });
      return webhook.send(`You are now set as AFK c:`).then((message) => message.delete({ timeout: 3000 }));
    }

    if (!premiumUser.isAFK || afkMessage) {
      premiumUser.isAFK = true;
      premiumUser.afkMessage = afkMessage;
    } else {
      premiumUser.isAFK = false;
      premiumUser.afkMessage = null;
    }
    await premiumUser.save();
    if (premiumUser.isAFK)
      return webhook.send(`You are now set as AFK c:`).then((message) => message.delete({ timeout: 3000 }));
    else return webhook.send(`You are no longer AFK c:`).then((message) => message.delete({ timeout: 3000 }));
  }
}

module.exports = ToggleAFKCommand;
