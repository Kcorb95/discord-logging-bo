const { Listener } = require("discord-akairo");
const Nicknames = require("../../../models/Nicknames");

class GuildMemberUpdateNameListener extends Listener {
  constructor() {
    super("guildMemberUpdateName", {
      emitter: "client",
      event: "guildMemberUpdate",
      category: "client",
    });
  }
  async exec(oldMember, newMember) {
    if (oldMember.nickname === newMember.nickname || newMember.nickname === null) return;

    const existingName = await Nicknames.findOne({
      where: { userID: newMember.id, guildID: newMember.guild.id, nickname: newMember.nickname },
    });
    if (!existingName)
      await Nicknames.create({
        userID: newMember.id,
        guildID: newMember.guild.id,
        nickname: newMember.nickname,
      });
  }
}

module.exports = GuildMemberUpdateNameListener;
