const { Command } = require(`discord-akairo`);

module.exports = class ReiCommand extends Command {
    constructor(id, options) {
        super(id, { ...options });
        this.whitelist = false;
        this.protected = false;
    }
};