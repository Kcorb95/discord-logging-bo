const { Listener } = require("discord-akairo");
const { MessageEmbed } = require("discord.js");
const Settings = require("../../../models/Settings");
const PremiumUsers = require("../../../models/PremiumUsers");

class PremiumMemberMentionedMessageListener extends Listener {
  constructor() {
    super("premiumMemberMentionedMessage", {
      emitter: "client",
      event: "message",
      category: "client",
    });
  }
  async exec(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.mentions.members.size === 0) return;
    const premiumrole = this.client.settings.get(message.guild.id, "premiumRole", undefined);
    if (!premiumrole) return;
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Kana");

    message.mentions.members.map(async (member) => {
      const fetchedMember = await member.fetch();
      if (fetchedMember.bot) return; // Don't do anything for bot mentions
      // If the member has the premium role
      if (fetchedMember.roles.cache.has(premiumrole)) {
        const premiumMember = await PremiumUsers.findOne({ where: { userID: fetchedMember.id } }); // See if it has mention defined
        if (!premiumMember) return;
        if (premiumMember.mentionEmoji) message.react(premiumMember.mentionEmoji); // If so, do thing
        if (premiumMember.isAFK) {
          message.react("💤");
          webhook
            .send(
              `**${fetchedMember.displayName}** is currently AFK...${
                premiumMember.afkMessage ? `\nReason: ${premiumMember.afkMessage}` : ""
              }`
            )
            .then((message) => message.delete({ timeout: 3000 }));
        }
      }
    });
  }
}

module.exports = PremiumMemberMentionedMessageListener;
