const { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler, Flag } = require("discord-akairo");
const path = require("path");
const emojiRegex = require("emoji-regex");

const SettingsProvider = require("../struct/SettingsProviders");
const Database = require("../struct/Database");
const Permissions = require("../struct/Permissions");
const Settings = require("../models/Settings");
const Logger = require("../util/Logger");
const MessageUtils = require("../util/MessageUtils");
const MuteScheduler = require("../struct/MuteScheduler");
const TimeoutScheduler = require("../struct/TimeoutScheduler");
const Premium = require("../struct/Premium");

class SakuraClient extends AkairoClient {
  constructor(config) {
    super(
      { ownerID: config.owner },
      {
        messageCacheMaxSize: 50,
        messageCacheLifetime: 300,
        messageSweepInterval: 900,
        disableEveryone: true,
        disabledEvents: ["TYPING_START"],
      }
    );

    this.commandHandler = new CommandHandler(this, {
      directory: path.join(__dirname, "..", "commands"),
      aliasReplacement: /-/g,
      prefix: (message) => this.settings.get(message.guild, "prefix", "/"),
      allowMention: true,
      fetchMembers: true,
      commandUtil: true,
      commandUtilLifetime: 3e5,
      commandUtilSweepInterval: 9e5,
      handleEdits: true,
      defaultCooldown: 3000,
      argumentDefaults: {
        prompt: {
          modifyStart: (msg, text) => text && `${msg.author} **::** ${text}\nType \`cancel\` to cancel this command.`,
          modifyRetry: (msg, text) => text && `${msg.author} **::** ${text}\nType \`cancel\` to cancel this command.`,
          timeout: (msg) => `${msg.author} **::** Time ran out, command has been cancelled.`,
          ended: (msg) => `${msg.author} **::** Too many retries, command has been cancelled.`,
          cancel: (msg) => `${msg.author} **::** Command has been cancelled.`,
          retries: 3,
          time: 30000,
        },
      },
    });

    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: path.join(__dirname, "..", "inhibitors"),
    });
    this.listenerHandler = new ListenerHandler(this, {
      directory: path.join(__dirname, "..", "listeners"),
    });

    this.config = config;
    this.settings = new SettingsProvider(Settings);
    this.cached = new Set();
    this.logger = Logger;
    this.messageUtils = MessageUtils;
    this.setup();
  }

  async setup() {
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      inhibitorHandler: this.inhibitorHandler,
      listenerHandler: this.listenerHandler,
    });

    await this.commandHandler.resolver.addType("validEmoji", async (message, phrase) => {
      if (!phrase) return Flag.fail("That is not a valid emoji.");
      const regex = emojiRegex();
      if (regex.exec(phrase)) return phrase;
      const guildEmojiType = this.commandHandler.resolver.type("emoji");
      const emoji = guildEmojiType(message, phrase);
      if (!emoji) return Flag.fail("That is not a valid emoji.");
      return emoji;
    });

    await this.commandHandler.resolver.addType("nonModMember", async (message, phrase) => {
      if (!phrase) return Flag.fail("That is not a valid member.");
      await message.guild.members.fetch();
      const memberType = this.commandHandler.resolver.type("member");
      const member = memberType(message, phrase);
      if (!member) return Flag.fail("That is not a valid member.");
      if (message.author.id === "134349083568504832" && member.id === "134349083568504832") return Flag.fail("lewd.");
      if (message.author.id === member.id) return Flag.fail("Disgusting..."); // Can't act on self
      const perms = member.permissions.serialize();
      if (
        // Can't act on another moderator
        perms.KICK_MEMBERS ||
        perms.BAN_MEMBERS ||
        perms.ADMINISTRATOR ||
        perms.MANAGE_CHANNELS ||
        perms.MANAGE_GUILD ||
        perms.MANAGE_MESSAGES
      )
        return Flag.fail("You can't do this to another staff member you stupid fuckin nerd.");
      return member;
    });

    this.commandHandler.loadAll();
    this.inhibitorHandler.loadAll();
    this.listenerHandler.loadAll();
  }

  async start() {
    await Database.authenticate();
    await this.settings.init();
    await Permissions.sync();
    //await Premium.init();
    await this.login(this.config.token);

    await TimeoutScheduler.sync(this.guilds);
    await MuteScheduler.sync(this.guilds);
    return setInterval(async () => {
      console.log(`Syncing Mutes and Timeouts...`);
      await TimeoutScheduler.sync(this.guilds);
      await MuteScheduler.sync(this.guilds);
    }, 240000);
  }
}

module.exports = SakuraClient;
