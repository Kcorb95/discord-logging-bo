/* eslint-disable multiline-ternary */
const { Listener } = require("discord-akairo");
const Logger = require("../../util/Logger");
const Sentry = require("@sentry/node");

class ErrorListener extends Listener {
  constructor() {
    super("error", {
      event: "error",
      emitter: "commandHandler",
      category: "commandHandler",
    });
  }

  async exec(error, message, command) {
    const tag = message.guild ? `${message.guild.name}/${message.author.tag}` : `${message.author.tag}`;
    Logger.error(`[${message.content}] ${error}`, { tag });

    Sentry.addBreadcrumb({
      message: "command_errored",
      category: command ? command.category.id : "inhibitor",
      level: Sentry.Severity.Error,
      data: {
        user: {
          id: message.author.id,
          username: message.author.tag,
        },
        guild: message.guild
          ? {
              id: message.guild.id,
              name: message.guild.name,
            }
          : null,
        command: command
          ? {
              id: command.id,
              aliases: command.aliases,
              category: command.category.id,
            }
          : null,
        message: {
          id: message.id,
          content: message.content,
        },
      },
    });
    Sentry.captureException(error);

    if (message.guild ? message.channel.permissionsFor(this.client.user).has("SEND_MESSAGES") : true) {
      const commandReply = await message.channel.send(
        `Oops! There was a problem running this command. My human overlords have been informed of this error. Please try again later!`
      );
      commandReply.delete({ timeout: 6000 });
    }
  }
}

module.exports = ErrorListener;
