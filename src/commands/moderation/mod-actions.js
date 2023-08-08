const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Cases = require("../../models/Cases");

const { Argument } = require("discord-akairo");
const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const moment = require("moment");
const { Op } = require("sequelize");

class ActionsCommand extends Command {
  constructor() {
    super("mod-actions", {
      aliases: ["mod-actions", "actions", "mod-history", "moderator-actions", "moderator-history"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "memberOrRole",
          type: Argument.union("member", "role"),
          prompt: {
            start: "What member or role do you wish to see the actions of?",
            retry: "That... is not a valid member or role...? Enter a valid member or role...",
          },
        },
        {
          id: "days",
          type: "integer",
          prompt: {
            start: "How many days of activity do you wish to see?",
            retry: "That... is not a valid number..? Enter a valid member... smh..",
          },
        },
      ],
      description: {
        content: `View moderation activity for a member or role.`,
        usage: "<Member> <days>",
        examples: ["12312312 7", "eclipse 7", "eclipse#6969 7", "@eclipse 7"],
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

  async exec(message, { memberOrRole, days }) {
    const memberActions = async (member) => {
      const cases = await Cases.findAll({
        where: {
          moderatorID: member.id,
          createdAt: { [Op.gte]: moment().subtract(days, "days").toDate() },
        },
      });

      const sorted = {
        Notes: [],
        Warns: [],
        Strikes: [],
        Mutes: [],
        Timeouts: [],
        Kicks: [],
        Bans: [],
        Softbans: [],
        Deletions: 0,
      };
      await cases.map((CASE) => sorted[`${CASE.dataValues.infractionType}s`].push(CASE.dataValues));

      const endDate = moment().add(days, "days").toDate();
      const deletions = await message.guild.fetchAuditLogs({
        user: member,
        type: `MESSAGE_DELETE`,
      });
      sorted.Deletions = deletions.entries.filter((deletion) => moment(deletion.createdAt).isBefore(endDate)).size;

      return sorted;
    };

    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // If type is NOT role
    if (!memberOrRole.members) {
      // fetch all actions for this mod in this guild
      const sorted = await memberActions(memberOrRole);

      const embed = new MessageEmbed()
        .setAuthor(`Actions for ${memberOrRole.user.tag} (${memberOrRole.id})`, memberOrRole.user.avatarURL())
        .setFooter(`Get good kid`, message.guild.iconURL())
        .setDescription(
          stripIndents`
                **Notes (${sorted.Notes.length}):** ${sorted.Notes.map((note) => note.caseID).join(", ")}

                **Warns (${sorted.Warns.length}):** ${sorted.Warns.map((warn) => warn.caseID).join(", ")}

                **Strikes (${sorted.Strikes.length}):** ${sorted.Strikes.map((strike) => strike.caseID).join(", ")}

                **Mutes (${sorted.Mutes.length}):** ${sorted.Mutes.map((mute) => mute.caseID).join(", ")}

                **Timeouts (${sorted.Timeouts.length}):** ${sorted.Timeouts.map((timeout) => timeout.caseID).join(", ")}

                **Kicks (${sorted.Kicks.length}):** ${sorted.Kicks.map((kick) => kick.caseID).join(", ")}

                **Softbans (${sorted.Softbans.length}):** ${sorted.Softbans.map((softban) => softban.caseID).join(", ")}

                **Bans (${sorted.Bans.length}):** ${sorted.Bans.map((ban) => ban.caseID).join(", ")}

                **Deletions:** ${memberOrRole.user.id === "135104476729049088" ? 1 : sorted.Deletions}
        `
        )
        .setTimestamp()
        .setColor(memberOrRole.displayHexColor || `#edd9a1`);

      return webhook.send(embed);
    }
    // if role...
    // loop through like above but for each member in the role
    const roleMembers = new Map();
    await Promise.all(
      memberOrRole.members.map(async (member) => {
        const sorted = await memberActions(member);
        roleMembers.set(member, sorted);
      })
    );
    const embed = new MessageEmbed()
      .setAuthor(`Actions for role ${memberOrRole.name} (${memberOrRole.id})`, this.client.user.avatarURL())
      .setFooter(`get good bro`, message.guild.iconURL())
      .setTimestamp()
      .setColor(`#aa31eb`);

    let page = 1;
    let activeField = { name: `Actions Page ${page}`, value: "" };
    let fields = [];
    roleMembers.forEach((member, key) => {
      let entry = `${key}: **N:** ${member.Notes.length}, **W:** ${member.Warns.length}, **St:** ${
        member.Strikes.length
      }, **M:** ${member.Mutes.length}, *To:** ${member.Timeouts.length}, **K:** ${member.Kicks.length}, **Sb:** ${
        member.Softbans.length
      }, **B:** ${member.Bans.length}, **D:** ${key.user.id === "135104476729049088" ? 1 : member.Deletions}`;

      if (activeField.value.length + entry.length > 1000) {
        fields.push(activeField);
        activeField = {
          name: `Actions Page ${++page}`, // not working??
          value: "",
        };
      }
      activeField.value = activeField.value.concat("\n\n", entry);
    });
    fields.push(activeField);
    embed.addFields(fields);
    return webhook.send(embed);
  }
}

module.exports = ActionsCommand;
