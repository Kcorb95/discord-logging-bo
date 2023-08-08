const Command = require("../../struct/Command");
const GuildRoles = require("../../models/GuildRoles");
const RoleGroups = require("../../models/RoleGroups");

class AddSyncRoleCommand extends Command {
  constructor() {
    super("add-sync-role", {
      aliases: ["add-sync-role", "asr", "add-sync"],
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
        {
          id: "groupID",
          type: "integer",
          prompt: {
            start: "What role sync group do you wish to add this role to?",
            retry: "That is not a valid number. Please enter a valid number...",
            optional: true,
          },
        },
      ],
      description: {
        content: `Adds a role to a role sync group so that role state and member role state is synced cross guild...`,
        usage: "<role> <groupID>",
        examples: ["Member", "123124124", , "123123 5", "@Member 5"],
      },
    });
    this.protected = true;
  }

  userPermissions(message) {
    if (message.author.id === this.client.ownerID) return null;
    if (message.author.id !== message.guild.ownerID) return "GuildOwner";
    return null;
  }

  async exec(message, { role, groupID }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Rei");

    // Check if this role is already synced and return false if already synced
    const existingRole = await GuildRoles.findAll({ where: { roleID: role.id } }).catch((err) => console.log(err));
    if (existingRole.length > 0)
      return webhook.send(`Error: This role is already configured to a sync group... (GroupID: ${existingRole[0].groupID})`);
    // Check if this group ID exists, otherwise create a new one using default increment value.
    const groupRoles = await GuildRoles.findAll({ where: { groupID: groupID } }).catch((err) => console.log(err));
    if (!groupRoles || groupRoles.length === 0) {
      const newGroup = await RoleGroups.create();
      groupID = newGroup.groupID;
    }
    // If it exists, check if there is already a role in this group id for THIS guild
    // AND
    // Check if message author is guild owner in all guilds for this group and return false if not
    const error = await groupRoles.map(async (role) => {
      // check if this guild already has a role in this group
      if (role.guildID === message.guild.id)
        return webhook.send(
          `Error: This group already has a role configured for this guild. Groups may only have ONE role per guild. Try creating a new group or removing the old role from this group...`
        );
      // Find Guild, Check if owner, if no, return error u cant do
      const guild = await this.client.guilds.get(role.guildID);
      if (guild.ownerID !== message.author.id)
        return webhook.send(`Error: You must be the guild owner in all guilds for this group to do this...`); // What if owner changes in one guild? How do we handle this?
    });
    // Add role to the group and return value of the group (or whole group details)
    if (error.length === 0) {
      const created = await GuildRoles.create({
        roleID: role.id,
        guildID: role.guild.id,
        groupID: groupID,
      });

      return webhook.send(`Created! (GroupID: ${created.groupID})`);
    }
  }
}

module.exports = AddSyncRoleCommand;
