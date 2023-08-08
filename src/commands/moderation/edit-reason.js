const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");

class EditReasonCommand extends Command {
  constructor() {
    super("edit-reason", {
      aliases: ["edit-reason", "reason"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "caseID",
          type: "integer",
          prompt: {
            start: "What is the Case ID for the case you wish to edit?",
            retry: "That is an invalid Case ID! Please enter a valid Case ID...",
          },
        },
        {
          id: "reason",
          type: "string",
          match: "rest",
          prompt: {
            start: `Please enter the new reason for this case...`,
            retry: `IDK how you fucked that up. Just enter something...`,
          },
        },
      ],
      description: {
        content: `Changes the reason for a logged case.`,
        usage: "<caseID> <reason>",
        examples: ["123 test"],
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

  async exec(message, { caseID, reason }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    const caseEdit = await Moderation.editReason(caseID, reason, message.guild);
    if (caseEdit === "NO_CASE")
      return webhook.send(`**Error:** Could not find case! Please check that you have the correct caseID...`);
    // success
    return webhook.send(`Case Edited!`);
  }
}

module.exports = EditReasonCommand;
