const PermissionsTable = require("../models/GuildPermissions");
/**
 * [[commandName.guildID1, {whitelist: boolean, roles[[id, val]], channels[[id, val]], members[]}], [commandName.guildID2, {whitelist: boolean, roles[], channels[], members[]}]}
 */
const PERMS_CACHE = new Map();

module.exports = class Permissions {
  /**
   * Syncs database settings to cache
   */
  static async sync() {
    const permsTable = await PermissionsTable.findAll(); // Get all settings
    PERMS_CACHE.clear(); // Purge cache
    permsTable.forEach((commandPerms) => {
      // Rebuild Cache
      PERMS_CACHE.set(commandPerms.commandNameGuildIDPair, {
        whitelist: commandPerms.whitelist,
        roles: new Map(commandPerms.roles.map((i) => [i.id, i.val])), // https://stackoverflow.com/questions/26264956/convert-object-array-to-hash-map-indexed-by-an-attribute-value-of-the-object
        channels: new Map(commandPerms.channels.map((i) => [i.id, i.val])),
        members: new Map(commandPerms.members.map((i) => [i.id, i.val])),
      });
    });
  }

  /**
   * Checks if a command can be run
   *
   * @param commandObject Command
   * @param guildObject Guild
   * @param channelObject GuildChannel
   * @param memberObject GuildMember
   * @returns boolean
   */
  static canRun(commandObject, guildObject, channelObject, memberObject) {
    // get entry from cache = `${uniqueCommandName}.${guildObject.id}`
    // Check if whitelist
    // If whitelist, check if explicit denies *anywhere*. If any explicit denies, return false
    // If whitelist, check roles, channel, guild. If any are true, return true.
    // If whitelist, if no trues ANYWHERE, return false.
    // If blacklist, check explicit denies *anywhere*. If any exist, return false.
    // If blacklist, nothing set, return true.

    const CGPair = `${commandObject.id}.${guildObject.id}`;

    let existingPerms = PERMS_CACHE.get(CGPair);
    if (!existingPerms) {
      //console.log(`returning ${!commandObject.whitelist} because existingPerms not found, defaulting to whitelist value.`);
      return !commandObject.whitelist;
    } // Whitelist is defaulted to false, so if this command has no existing perms, default to the value of the whitelist (NOT false = can run. NOT true = cannot run).

    // Check by specificity
    const memberPerms = existingPerms.members.get(memberObject.id); // Get settings for this member
    const channelPerms = existingPerms.channels.get(channelObject.id); // Get settings for this channel
    //console.log(`memberPerms: ${memberPerms}`);
    //console.log(`channelPerms: ${channelPerms}`);
    if (memberPerms === true) {
      //console.log(`Returning true because member has perms explicitly set to true for self`);
      return true; // check if member is set and true
    } else if (memberPerms === false) {
      //console.log(`Returning false because member has perms explicitly set to false for self`);
      return false; // if member set and false
    } else if (
      Array.from(existingPerms.roles).some((setting) => {
        // If member has a role that matches a set target in command role perms
        //console.log(setting);
        if (
          memberObject.roles.cache.some((role) => role.id === setting[0]) &&
          !setting[1]
        )
          return true; // If the target is denied for the command, return true
      })
    ) {
      //console.log(`Returning false because member has a role whose perms explicitly set to false`);
      return false; // If returned value is true, cannot run
    } else if (
      Array.from(existingPerms.roles).some((setting) => {
        // If member has a role that matches a set target in command role perms
        if (
          memberObject.roles.cache.some((role) => role.id === setting[0]) &&
          setting[1]
        )
          return true; // If target is permitted, return true
      })
    ) {
      //console.log(`Returning true because member has a role whose perms explicitly set to true`);
      return true; // If returned value is true, can run
    } else if (channelPerms === true) {
      //console.log(`Returning true because channel has perms explicitly set to true`);
      return true;
    } else if (channelPerms === false) {
      //console.log(`Returning false because channel has perms explicitly set to false`);
      return false;
    } else if (existingPerms.whitelist === true) {
      //console.log(`Returning false because no perms found and due to whitelist being set to true, only explicit trues should be able to run.`);
      return false;
    } else if (existingPerms.whitelist === false) {
      //console.log(`Returning true because no perms found and due to whitelist being set to false, anyone can run unless set to false`);
      return true;
    }
    //console.log(`This should not have been reached!`);
    return false; // Return false in case check fails
  }

  /**
   * Marks a command as whitelist or blacklist only
   *
   * @param commandObject Command
   * @param guildObject Guild
   * @param value boolean
   * @returns boolean
   */
  static async setWhitelist(commandObject, guildObject, value) {
    if (commandObject.protected === true) {
      //console.log(`Command is protected, whitelist not changed!`);
      return false;
    }

    const CGPair = `${commandObject.id}.${guildObject.id}`;

    // We want to get the existing settings, even if it doesn't exist so that we can properly set new settings using existing values
    let existingPerms = PERMS_CACHE.get(CGPair);
    PERMS_CACHE.set(CGPair, {
      whitelist: value,
      roles: !existingPerms ? new Map() : existingPerms.roles,
      channels: !existingPerms ? new Map() : existingPerms.channels,
      members: !existingPerms ? new Map() : existingPerms.members,
    });

    let existingDBPerms = await PermissionsTable.findOne({
      where: { commandNameGuildIDPair: CGPair },
    });
    if (!existingDBPerms)
      await PermissionsTable.create({
        commandNameGuildIDPair: CGPair,
        whitelist: commandObject.whitelist,
        roles: [],
        channels: [],
        members: [],
      });
    else {
      existingDBPerms.whitelist = value;
      await existingDBPerms.save();
    }

    //console.log(PERMS_CACHE.get(CGPair));
    //console.log(`Received: Whitelist in ${commandObject.id} set to ${value} in guild: ${guildObject.name}`);
  }

  static async setPermission(commandObject, guildObject, type, id, value) {
    if (commandObject.protected === true) {
      //console.log(`Command is protected, Permissions not changed!`);
      return false;
    }

    const CGPair = `${commandObject.id}.${guildObject.id}`;

    // We want to get the existing settings, even if it doesn't exist so that we can properly set new settings using existing values
    let existingPerms = PERMS_CACHE.get(CGPair);
    if (!existingPerms) {
      PERMS_CACHE.set(CGPair, {
        whitelist: commandObject.whitelist,
        roles: new Map(),
        channels: new Map(),
        members: new Map(),
      });
      existingPerms = PERMS_CACHE.get(CGPair);
    }

    PERMS_CACHE.set(CGPair, {
      whitelist: existingPerms.whitelist,
      roles:
        type === "ROLE"
          ? existingPerms.roles.set(id, value)
          : existingPerms.roles,
      channels:
        type === "CHANNEL"
          ? existingPerms.channels.set(id, value)
          : existingPerms.channels,
      members:
        type === "MEMBER"
          ? existingPerms.members.set(id, value)
          : existingPerms.members,
    });

    let existingDBPerms = await PermissionsTable.findOne({
      where: { commandNameGuildIDPair: CGPair },
    });
    if (!existingDBPerms)
      existingDBPerms = await PermissionsTable.create({
        commandNameGuildIDPair: CGPair,
        whitelist: commandObject.whitelist,
        roles: [],
        channels: [],
        members: [],
      });

    switch (type) {
      case "CHANNEL":
        const existingChannel = existingDBPerms.channels.findIndex(
          (setting) => setting.id === id
        );
        let channels = existingDBPerms.channels;
        if (existingChannel === -1) channels.push({ id: id, val: value });
        else channels[existingChannel].val = value;
        existingDBPerms.channels = channels;
        break;
      case "ROLE":
        const existingRole = existingDBPerms.roles.findIndex(
          (setting) => setting.id === id
        );
        let roles = existingDBPerms.roles;
        if (existingRole === -1) roles.push({ id: id, val: value });
        else roles[existingRole].val = value;
        existingDBPerms.roles = roles;
        break;
      case "MEMBER":
        const existingMember = existingDBPerms.members.findIndex(
          (setting) => setting.id === id
        );
        let members = existingDBPerms.members;
        if (existingMember === -1) members.push({ id: id, val: value });
        else members[existingMember].val = value;
        existingDBPerms.members = members;
        break;
    }
    await existingDBPerms.save();

    //console.log(PERMS_CACHE.get(CGPair));
    //console.log(`Received: ${commandObject.id} set to ${value} for type: ${type}, ${id} in guild: ${guildObject.name}`);
  }

  static async clearPermission(commandObject, guildObject, type, id) {
    if (commandObject.protected === true) {
      //console.log(`Command is protected, Permissions not cleared!`);
      return false;
    }

    const CGPair = `${commandObject.id}.${guildObject.id}`;

    // We want to get the existing settings, even if it doesn't exist so that we can properly set new settings using existing values
    let existingPerms = PERMS_CACHE.get(CGPair);
    if (!existingPerms) return;

    type === "ROLE"
      ? existingPerms.roles.delete(id)
      : type === "CHANNEL"
      ? existingPerms.channels.delete(id)
      : existingPerms.members.delete(id);

    PERMS_CACHE.set(CGPair, {
      whitelist: existingPerms.whitelist,
      roles: existingPerms.roles,
      channels: existingPerms.channels,
      members: existingPerms.members,
    });

    let existingDBPerms = await PermissionsTable.findOne({
      where: { commandNameGuildIDPair: CGPair },
    });
    if (!existingDBPerms) return;

    switch (type) {
      case "CHANNEL":
        const existingChannel = existingDBPerms.channels.findIndex(
          (setting) => setting.id === id
        );
        let channels = existingDBPerms.channels;
        if (existingChannel === -1) return;
        else channels.splice(existingChannel, 1);
        existingDBPerms.channels = channels;
        break;
      case "ROLE":
        const existingRole = existingDBPerms.roles.findIndex(
          (setting) => setting.id === id
        );
        let roles = existingDBPerms.roles;
        if (existingRole === -1) return;
        else roles.splice(existingRole, 1);
        existingDBPerms.roles = roles;
        break;
      case "MEMBER":
        const existingMember = existingDBPerms.members.findIndex(
          (setting) => setting.id === id
        );
        let members = existingDBPerms.members;
        if (existingMember === -1) return;
        else members.splice(existingMember, 1);
        existingDBPerms.members = members;
        break;
    }
    await existingDBPerms.save();

    //console.log(PERMS_CACHE.get(CGPair));
    //console.log(`Received: Clear perms for type ${type} - ${id} in command, ${commandObject.id} in guild: ${guildObject.name}`);
  }

  static async getCommandPermissions(commandObject, guildObject) {
    const CGPair = `${commandObject.id}.${guildObject.id}`;
    const cachedPerms = PERMS_CACHE.get(CGPair);
    //console.log(`cached perms for CGPair ${CGPair} is: `);
    //console.log(cachedPerms);
    if (!cachedPerms)
      return {
        commandID: commandObject.id,
        commandWhitelist: commandObject.whitelist,
        commandProtected: commandObject.protected,
        ownerOnly: commandObject.ownerOnly,
      };
    else
      return {
        commandID: commandObject.id,
        commandWhitelist: cachedPerms.whitelist,
        commandProtected: commandObject.protected,
        ownerOnly: commandObject.ownerOnly,
        memberPerms: JSON.stringify([...cachedPerms.members]),
        rolePerms: JSON.stringify([...cachedPerms.roles]),
        channelPerms: JSON.stringify([...cachedPerms.channels]),
      };
  }
};
