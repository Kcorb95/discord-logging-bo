const Command = require("../../../../struct/Command");

class SetCaseLogChannel extends Command {
    constructor() {
        super("set-case-log-channel", {
            aliases: [
                "set-case-log",
                "set-case-logs",
                "set-mod-log",
                "set-mod-logs",
                "set-case-log-channel",
                "set-case-logs-channel",
                "set-mod-log-channel",
                "set-mod-logs-channel",
            ],
            category: "guildOwner",
            channel: "guild",
            args: [
                {
                    id: "channel",
                    match: "content",
                    type: "textChannel",
                    prompt: {
                        start: "What channel should case logs be sent to?",
                        retry: "That is not a valid channel! Please check help and try again.",
                    },
                },
            ],
            description: {
                content: ["Sets the default channel for moderation action case logging."],
                usage: "<channel>",
                examples: ["#case-logs", "case-logs"],
            },
        });
        this.protected = true;
    }

    userPermissions(message) {
        if (message.author.id === this.client.ownerID) return null;
        if (message.author.id !== message.guild.ownerID) return "GuildOwner";
        return null;
    }

    async exec(message, { channel }) {
        this.client.settings.set(message.guild, "caseLogChannel", channel.id);
        return message.util.reply(`case logs will now be sent to ${channel}`);
    }
}

module.exports = SetCaseLogChannel;
