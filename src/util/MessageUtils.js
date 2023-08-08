class MessageUtils {
  static async fetchWebhook(channel, hookName) {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find((webhook) => webhook.name === hookName || webhook.name === channel.client.user.username); // Name something generic later
    if (!webhook)
      switch (hookName) {
        case "Asuka": {
          webhook = await channel.createWebhook("Asuka", {
            avatar: `https://i.imgur.com/9rIwlja.png`,
            reason: "For messaging without ratelimits. Do not change!",
          });
          break;
        }
        case "Kana": {
          webhook = await channel.createWebhook("Kana", {
            avatar: "https://i.imgur.com/GLcaWPZ.jpg",
            reason: "For messaging without ratelimits. Do not change!",
          });
          break;
        }
        default: {
          webhook = await channel.createWebhook(channel.client.user.username, {
            avatar: channel.client.user.avatarURL(),
            reason: "For messaging without ratelimits. Do not change!",
          });
          break;
        }
      }
    return webhook;
  }

  static async getInput(channel, filter) {
    let response = "";
    let responded = false;
    while (!responded) {
      const responses = await channel.awaitMessages(filter, {
        max: 1,
        time: 60000,
      });

      if (!responses || responses.size !== 1) {
        return "CANCEL";
      }

      response = responses.first();

      if (
        response.content.toUpperCase() === "CANCEL" ||
        response.content.toUpperCase() === "QUIT" ||
        response.content.toUpperCase() === "ABORT"
      )
        return "CANCEL";
      else return response.content;
    }
  }

  static async getValidReason(channel, filter) {
    let validReason = false;
    let reason = "";
    while (!validReason) {
      reason = await this.getInput(channel, filter);
      if (!reason || reason === "CANCEL") return "CANCEL";
      if (reason.length > 800) channel.send(`Reason too long, please enter a reason under 800 characters...`);
      else validReason = true;
    }
    return reason;
  }

  static async getImageInput(channel, filter) {
    let response = "";
    let responded = false;
    while (!responded) {
      const responses = await channel.awaitMessages(filter, {
        max: 1,
        time: 60000,
      });

      if (!responses || responses.size !== 1) {
        return "CANCEL";
      }

      response = responses.first();

      if (
        response.content.toUpperCase() === "CANCEL" ||
        response.content.toUpperCase() === "QUIT" ||
        response.content.toUpperCase() === "ABORT"
      )
        return "CANCEL";

      if (response.content.toUpperCase() === "SKIP") return "SKIP";

      const regex = new RegExp("(http(s?):)([/|.|\\w|\\s|-])*\\.(?:jpg|gif|png)");
      // If has attachments, take the first one's URL
      if (response.attachments.size > 0) return response.attachments.first().url;
      // Test if the message content contains an image
      if (regex.test(response.content)) return response.content.match("(http(s?):)([/|.|\\w|\\s|-])*\\.(?:jpg|gif|png)")[0]; // If ye, ONLY send the link part
    }
  }
}

module.exports = MessageUtils;
