const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const Cases = db.define("cases", {
  caseID: {
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
  infractionType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  reason: {
    type: Sequelize.STRING(1024),
    allowNull: false,
  },
  dmReason: {
    type: Sequelize.STRING(1024),
    allowNull: true,
  },
  screenshot: {
    type: Sequelize.STRING(2000),
    allowNull: true,
  },
  moderatorID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  caseMessageID: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  muteDuration: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  timeoutChannelID: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  messagePrune: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

module.exports = Cases;
