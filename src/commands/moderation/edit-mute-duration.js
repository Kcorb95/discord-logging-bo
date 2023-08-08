const { ms } = require("@naval-base/ms");

const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");
const MuteScheduler = require("../../struct/MuteScheduler");
const Mutes = require("../../models/Mutes");

class EditMuteCommand extends Command {
  constructor() {
    super("edit-mute-duration", {
      aliases: ["edit-mute-duration", "edit-mute", "change-mute", "mute-dur", "mute-duration"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "member",
          type: "nonModMember",
          prompt: {
            start: "What member would you like to mute?",
            retry: (message, { failure }) => `${failure.value} Try again...`,
          },
        },
        {
          id: "duration",
          type: (_, str) => {
            if (!str) return null;
            const duration = ms(str);
            if (duration && duration >= 300000 && !isNaN(duration)) return duration;
            return null;
          },
          prompt: {
            start: `For how long do you want the mute to last? (seconds, minutes, hours, days) Must be longer than 5 minutes..`,
            retry: `Please use a proper time format! (seconds, minutes, hours days) Must be longer than 5 minutes..`,
          },
        },
      ],
      description: {
        content: `Unmutes a user.`,
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

  async exec(message, { member, duration }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    const isMuted = await MuteScheduler.fetchMute(member);
    if (!isMuted) return webhook.send(`**Error:** This user is not muted!`);

    // find mute in the database and destroy it if it exists
    const mutes = await Mutes.findAll({ where: { userID: member.id, guildID: member.guild.id } });
    mutes.map((mute) => mute.destroy());

    // removes mute from the unmute queue
    MuteScheduler.unQueue(`${member.user.id}.${message.guild.id}`);

    // Reschedule mute
    await MuteScheduler.scheduleMute(member, duration, isMuted.caseID);

    // Edit mute duration in caselogs...
    const caseEdit = await Moderation.editMuteDuration(isMuted.caseID, duration, message.guild);
    if (caseEdit === "NO_CASE")
      return webhook.send(`**Error:** Could not find case... Mute has been extended but not logged.`);
    if (caseEdit === "NO_CHANNEL")
      return webhook.send(
        `**Error:** Could not find case logs channel... Please configure the case logs channel to continue.\nMute has been extended but not logged.`
      );
    // success
    return webhook.send(`${member} Anta Baka?!?`);
  }
}

module.exports = EditMuteCommand;
