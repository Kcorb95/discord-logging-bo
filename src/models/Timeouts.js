const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const Timeouts = db.define("timeouts", {
  muteID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  },
  userID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  guildID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  channelID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  muteEnd: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  caseID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
  },
});

module.exports = Timeouts;
