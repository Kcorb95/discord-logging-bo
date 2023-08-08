const { Argument } = require("discord-akairo");
const { stripIndents } = require("common-tags");

const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");

class CybernukeCommand extends Command {
  constructor() {
    super("cybernuke", {
      aliases: ["cybernuke", "tactical-nuke", "raid-ban", "mass-ban", "cubernuke", "cuybernuke"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "joinAge",
          type: Argument.range("number", 1, 45),
          prompt: {
            start:
              "How old (in minutes) should a member be for the cybernuke to ignore them?(Maximum 20 minutes.. This is the server join date)",
            retry: "That... is not a valid number...? Enter a valid number...",
            optional: true,
          },
          default: 10,
        },
        {
          id: "accountAge",
          type: Argument.range("number", 1, 43200),
          prompt: {
            start:
              "How old (in minutes) should a user's account be for the cybernuke to ignore them? (Maximum 20160 minutes or 14 days... Generally I use 7200 for 5 days.)",
            retry: "That... is not a valid number...? Enter a valid number...",
            optional: true,
          },
          default: 20160,
        },
      ],
      description: {
        content: `Rains hell down upon a channel. Useful for raids where your finger game is too weak to keep up. Plebs...`,
        usage: "<MinutesInServer> <AccountAge>",
        examples: ["5 7200", "5", "20 20160"],
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

  async exec(message, { joinAge, accountAge }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    await webhook.send(`Calculating targeting parameters for tactical cybernuke. Please standby...`);

    const memberAgeCutoff = Date.now() - joinAge * 60000;
    const accountAgeCuttoff = Date.now() - accountAge * 60000;

    await message.guild.members.fetch();
    const targets = message.guild.members.cache.filter(
      (member) =>
        member.joinedTimestamp > memberAgeCutoff &&
        member.user.createdTimestamp > accountAgeCuttoff &&
        member.bannable &&
        !member.user.bot
    );
    webhook.send(`I have identified ${targets.size} possible targets... Proceed?`);

    const yes = ["yes", "yeah", "yup", "ye", "true"];
    const no = ["no", "nope", "na", "nah", "false", "cancel", "quit", "abort"];
    const booleanFilter = (m) =>
      m.author.id === message.author.id &&
      (yes.some((val) => m.content.toLowerCase().indexOf(val) > -1) ||
        no.some((val) => m.content.toLowerCase().indexOf(val) > -1));
    const reason = await this.client.messageUtils.getInput(message.channel, booleanFilter);
    if (!reason || reason === "CANCEL" || no.some((val) => reason.toLowerCase().indexOf(val) > -1))
      return webhook.send(`Cybernuke Aborted...`);

    webhook.send(`Launching Cybernuke...`);
    webhook.send(`https://gfycat.com/satisfiedneathorseshoecrab`);

    let fatalities = 0;
    const survivors = [];
    const promises = [];
    let status = await webhook.send(`Impact confirmed. Casualty Report Incoming...`);

    for (const target of targets.values()) {
      const dm = await target.createDM();
      promises.push(
        await dm
          .send(
            stripIndents`
            You have been automatically banned in ${message.guild.name} due to an ongoing raid.
            If you believe this ban was made in error and you had no participation in the raid, please appeal the ban in our HQ server found here
            https://goo.gl/forms/g4hF0SnVcT8rBqFw2
            https://discord.gg/tR9yB86`
          )
          .catch((e) => console.warn(e))
          .then(async () => target.ban({ reason: "Cybernuke", days: 1 }))
          .then(() => fatalities++)
          .catch((e) => {
            survivors.push(target);
            console.warn(e);
          })
          .then(async () => {
            if (targets.size <= 5) return;
            if (promises.length % 5 === 0) {
              status.delete();
              status = await webhook.send(
                `Impact confirmed. Casualty Report Incoming... (${Math.round((promises.length / targets.size) * 100)}%)`
              );
            }
          })
      );
    }
    await Promise.all(promises);
    return webhook.send(stripIndents`
                Impact Confirmed...
                __**Fatalities:**__ ${fatalities}
                ${
                  survivors.length > 0
                    ? `__**Survivors:**__
                ${survivors.join(` **--** `)}`
                    : ``
                } `);
  }
}

module.exports = CybernukeCommand;
