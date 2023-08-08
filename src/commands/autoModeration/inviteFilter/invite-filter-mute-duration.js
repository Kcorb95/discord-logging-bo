const { ms } = require("@naval-base/ms");
const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class InviteFilterMuteDuration extends Command {
  constructor() {
    super("set-invite-filter-mute-duration", {
      aliases: [
        "set-invite-filter-mute-duration",
        "invite-filter-mute-duration",
        "invite-filter-mute-dur",
        "inv-filter-mute-dur",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "durationMS",
          type: (_, str) => {
            if (!str) return null;
            const duration = ms(str);
            if (duration && duration >= 60000 && !isNaN(duration)) return duration;
            return null;
          },
          prompt: {
            start: `For how long do you want the mute to last? (seconds, minutes, hours, days) Must be longer than 1 minute..`,
            retry: `Please use a proper time format! (seconds, minutes, hours days) Must be longer than 1 minute..`,
          },
        },
      ],
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

  async exec(message, { durationMS }) {
    const thefilter = await InviteManager.setMuteDuration(message.guild.id, ms(durationMS));

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      content: `Filter mute duration has been set to ${ms(durationMS)}`,
      embeds: [filterembed],
    });
  }
}

module.exports = InviteFilterMuteDuration;
