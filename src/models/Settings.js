const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const Settings = db.define("settings", {
  guildID: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  prefix: {
    type: Sequelize.STRING,
    defaultValue: "/",
  },
  caseLogChannel: {
    type: Sequelize.STRING,
  },
  muteRole: {
    type: Sequelize.STRING,
  },
  premiumRole: {
    type: Sequelize.STRING,
  },
});

module.exports = Settings;
