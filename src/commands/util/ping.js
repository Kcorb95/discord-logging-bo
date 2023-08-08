const Command = require('../../struct/Command');

class PingCommand extends Command {
    constructor() {
        super('ping', {
            aliases: ['ping', 'rualive?', 'rualive'],
            category: 'util',
            description: { content: `Pings the bot and waits for a response indicating status` }
        });
        this.protected = true;
    }

    async exec(message) {
        const msg = await message.util.send(`Pinging...`);
        return message.util.send(`**Pong!** (Ping: ${((msg.editedTimestamp || msg.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp)).toString()} Heartbeat: ${Math.round(this.client.ws.ping).toString()})`)
    }
}

module.exports = PingCommand;