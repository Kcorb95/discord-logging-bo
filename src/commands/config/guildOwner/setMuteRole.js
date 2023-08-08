const Command = require("../../../struct/Command");

class SetMuteRoleCommand extends Command {
  constructor() {
    super("set-mute-role", {
      aliases: ["set-mute-role", "set-muted-role"],
      category: "guildOwner",
      channel: "guild",
      args: [
        {
          id: "role",
          type: "role",
          prompt: {
            start: "Please enter the Muted role that you wish to use...",
            retry: "That is not a valid role! Please check help and try again.",
          },
        },
      ],
      description: {
        content: ["Sets the role to use for mutes."],
        usage: "<@role>",
        examples: ["@Muted", "Muted", "123123123"],
      },
    });
    this.protected = true;
  }

  userPermissions(message) {
    if (message.author.id === this.client.ownerID) return null;
    if (message.author.id !== message.guild.ownerID) return "GuildOwner";
    return null;
  }

  async exec(message, { role }) {
    this.client.settings.set(message.guild, "muteRole", role.id);
    return message.util.reply(`${role} will now be used for mutes...`);
  }
}

module.exports = SetMuteRoleCommand;
