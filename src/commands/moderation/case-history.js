const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");

class CaseHistoryCommand extends Command {
  constructor() {
    super("case-history", {
      aliases: ["case-history", "cases", "offenses"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: "What member would you like to view the history of?",
            retry: "That... is not a valid member...? Enter a valid member...",
          },
        },
      ],
      description: {
        content: `View detailed info for a case.`,
        usage: "<Member>",
        examples: ["12312312", "eclipse", "eclipse#6969", "@eclipse"],
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

  async exec(message, { member }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Post History
    const userCaseHistory = await Moderation.fetchCaseHistory(message.guild, member);
    return await webhook.send(userCaseHistory);
  }
}

module.exports = CaseHistoryCommand;
