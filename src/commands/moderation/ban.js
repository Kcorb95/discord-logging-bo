const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");

class BanCommand extends Command {
  constructor() {
    super("ban", {
      aliases: ["ban"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "member",
          match: "content",
          type: "nonModMember",
          prompt: {
            start: "What member would you like to ban?",
            retry: (message, { failure }) => `${failure.value} Try again...`,
          },
        },
      ],
      description: {
        content: `Ban a member and optionally prune their messages as well as DM them with a separate reason.`,
        usage: "<Member>",
        examples: ["@User", "@Member", "1234515132412", "eclipse", "eclipse#1995"],
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

    if (!member.bannable)
      return webhook.send(
        `**Error:** This member is not bannable. Please check my permissions or if the user is still in the guild...`
      );

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

    await webhook.send(`__**Please enter a prune duration in days (0 - 7) for this ban or type \`cancel\` to quit...**__`);

    const validPrune = (m) => m.author.id === message.author.id && parseInt(m.content) >= 0 && parseInt(m.content) <= 7;
    const prunedur = await this.client.messageUtils.getInput(message.channel, validPrune);
    if (!prunedur || prunedur === "CANCEL") return webhook.send(`Command Cancelled...`);

    // Post Case to backend
    const createdCase = await Moderation.createCase(
      member,
      member.guild,
      "Ban",
      reason,
      dmReason,
      screenshot !== "SKIP" ? screenshot : null, // If screenshot provided, (will only ever be SKIP or a url..), include it otherwise null
      0,
      null,
      parseInt(prunedur),
      message.member
    );

    if (createdCase === "NO_CHANNEL") return webhook.send(`Error: Please configure the case logs channel for this bot!`);
    await member
      .send(
        `You have been banned from ${member.guild.name}!\nReason: ${dmReason}\nYou may appeal this ban by filling out our ban appeal form https://goo.gl/forms/g4hF0SnVcT8rBqFw2 \n https://discord.gg/tR9yB86`
      )
      .catch((e) => {
        webhook.send(
          `This user has DMs disabled! Please try to contact them through other means.\nThe DM reason has not been sent however this action has been recorded...`
        );
      });
    await member.ban({ days: parseInt(prunedur), reason: `By: ${message.member.user.tag} Ban: ${dmReason}` }).catch((e) => {
      webhook.send(`**Error:** This user was NOT banned! Please ban them manually now!`);
    });

    return webhook.send(`${member} **Anta Baka!?**`);
  }
}

module.exports = BanCommand;
