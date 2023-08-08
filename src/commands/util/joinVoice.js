const Command = require("../../struct/Command");
const tts = require("google-tts-api");

class JoinVoiceCommand extends Command {
  constructor() {
    super("join-voice", {
      aliases: ["join-voice", "join-vc"],
      category: "util",
      description: { content: `Pings the bot and waits for a response indicating status` },
      args: [
        {
          id: "phrase",
          match: "content",
          type: "string",
          prompt: {
            start: "What member do you want to add a note to?",
            retry: "That's not a valid member you fuckin dork. Try again...",
          },
        },
      ],
    });
    this.protected = true;
  }

  async exec(message, { phrase }) {
    if (message.member.voice.channel) {
      const connection = await message.member.voice.channel.join();
      tts(phrase, "en", 1).then(async (url) => {
        console.log(`TTS recieved`);
        // await connection.play(`http://tts.cyzon.us/tts?text=${phrase}`);
        await connection.play(url);
        //await connection.disconnect();
      });
    }
  }
}

module.exports = JoinVoiceCommand;
