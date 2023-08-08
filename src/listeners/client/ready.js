const { Listener } = require("discord-akairo");
const Logger = require("../../util/Logger");

class ReadyListener extends Listener {
  constructor() {
    super("ready", {
      event: "ready",
      emitter: "client",
      category: "client",
    });
  }

  exec() {
    Logger.info(`${this.client.user.tag} (${this.client.user.id}) is ready to serve...`, { tag: "READY" });
    this.client.user.setActivity("🍂");
  }
}

module.exports = ReadyListener;
