const { Listener } = require("discord-akairo");
const Usernames = require("../../../models/Usernames");

class UserUpdateNameListener extends Listener {
  constructor() {
    super("userUpdateName", {
      emitter: "client",
      event: "userUpdate",
      category: "client",
    });
  }
  async exec(oldUser, newUser) {
    if (oldUser.username === newUser.username) return;

    const existingName = await Usernames.findOne({ where: { userID: newUser.id, username: newUser.username } });
    if (!existingName)
      await Usernames.create({
        userID: newUser.id,
        username: newUser.username,
      });
  }
}

module.exports = UserUpdateNameListener;
