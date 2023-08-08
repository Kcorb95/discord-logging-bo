const Command = require("../../../struct/Command");

class SetPremiumRoleCommand extends Command {
  constructor() {
    super("set-premium-role", {
      aliases: ["set-premium-role"],
      category: "botOwner",
      channel: "guild",
      ownerOnly: true,
      args: [
        {
          id: "role",
          type: "role",
          prompt: {
            start: "Please enter the role that you wish to use...",
            retry: "That is not a valid role! Please check help and try again.",
          },
        },
      ],
      description: {
        content: ["Sets the role to use for premium."],
        usage: "<@role>",
        examples: ["@premium", "premium", "123123123"],
      },
    });
    this.protected = true;
  }

  async exec(message, { role }) {
    this.client.settings.set(message.guild, "premiumRole", role.id);
    return message.util.reply(`${role} will now be used for premium...`);
  }
}

module.exports = SetPremiumRoleCommand;
