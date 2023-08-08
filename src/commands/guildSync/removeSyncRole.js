const Command = require("../../struct/Command");
const GuildRoles = require("../../models/GuildRoles");
const RoleGroups = require("../../models/RoleGroups");

class RemoveSyncRoleCommand extends Command {
  constructor() {
    super("remove-sync-role", {
      aliases: ["remove-sync-role", "rsr", "remove-sync"],
      category: "guildSync",
      channel: "guild",
      args: [
        {
          id: "role",
          type: "role",
          prompt: {
            start: "What role are you trying to sync?",
            retry: "That is not a valid role. Please enter a valid role...",
          },
        },
      ],
      description: {
        content: `Removes a role from a role sync group...`,
        usage: "<role>",
        examples: ["Member", "123124124", "@Member"],
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
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Rei");

    // Check if this role is being synced. If it is not, return error
    const existingRole = await GuildRoles.findOne({ where: { roleID: role.id } }).catch((err) => console.log(err));
    if (!existingRole) return webhook.send(`Error: This role is not in a sync group...`);

    // Delete the entry...
    await existingRole.destroy();

    const roles = await GuildRoles.findAll({ where: { groupID: existingRole.groupID } });
    if (roles.length === 0) {
      const roleGroup = await RoleGroups.findOne({ where: { groupID: existingRole.groupID } });
      roleGroup.destroy();
      console.log(`deleted group`);
    }
    return webhook.send(`Deleted!`);
  }
}

module.exports = RemoveSyncRoleCommand;
