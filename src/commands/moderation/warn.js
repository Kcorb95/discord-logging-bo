const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");

class WarnCommand extends Command {
  constructor() {
    super("warn", {
      aliases: ["warn", "strike"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "member",
          match: "content",
          type: "nonModMember",
          prompt: {
            start: "What member would you like to warn/strike?",
            retry: (message, { failure }) => `${failure.value} Try again...`,
          },
        },
      ],
      description: {
        content: `Warns/strikes a user and DMs them with a separate reason. (Like the old Strike command)`,
        usage: "<Member>",
        examples: ["@User", "@Member", "1234515132412", "eclipse", "eclipse#1995"],
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

  async exec(message, { member }) {
    // Can we do this better by checking what alias was used?
    const type = message.content.toUpperCase().includes("WARN") ? "Warn" : "Strike";
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Post History
    const userCaseHistory = await Moderation.fetchCaseHistory(message.guild, member);
    await webhook.send(userCaseHistory);

    // Get reason
    await webhook.send(
      `__**Please review the above information...**__\nIf you believe this is the proper action,\n**Enter the reason now or type \`cancel\` to quit...**`
    );

    const reasonFilter = (m) => m.author.id === message.author.id && m.content.length > 0;
    const reason = await this.client.messageUtils.getValidReason(message.channel, reasonFilter);
    if (!reason || reason === "CANCEL") return webhook.send(`Command Cancelled...`);

    // Get Screenshot
    await webhook.send(`__Please upload a screenshot of the context if applicable or type \`skip\` to skip...__`);

    const screenshotFilter = (m) => m.author.id === message.author.id;
    const screenshot = await this.client.messageUtils.getImageInput(message.channel, screenshotFilter);
    if (!screenshot || screenshot === "CANCEL") return webhook.send(`Command Cancelled...`);

    await webhook.send(
      `__**Please enter the message to be DM'd to this user.**__\n**Enter the reason now or type \`cancel\` to quit...**`
    );

    const dmReason = await this.client.messageUtils.getValidReason(message.channel, reasonFilter);
    if (!dmReason || dmReason === "CANCEL") return webhook.send(`Command Cancelled...`);

    // Post Case to backend
    const createdCase = await Moderation.createCase(
      member,
      member.guild,
      type,
      reason,
      dmReason,
      screenshot !== "SKIP" ? screenshot : null, // If screenshot provided, (will only ever be SKIP or a url..), include it otherwise null
      0,
      null,
      0,
      message.member
    );
    if (createdCase === "NO_CHANNEL") return webhook.send(`**Error:** Please configure the case logs channel for this bot!`);
    await member
      .send(
        `You have recieved a ${type === "Warn" ? "warning" : "strike"} in ${
          member.guild.name
        }!\nReason: ${dmReason}\nPlease familiarize yourself with the rules to avoid further infractions. ${
          type === "STRIKE" ? "Having 3+ strikes can lead to kicks and/or bans..." : ""
        }\nIf you have any questions, please reach out to a mod in #support or open a ticket in #tickets :)`
      )
      .catch((e) => {
        webhook.send(
          `This user has DMs disabled! Please try to contact them through other means.\nThe DM reason has not been sent however this action has been recorded...`
        );
      });
    return webhook.send(`${member} **Anta Baka!?**`);
  }
}

module.exports = WarnCommand;
