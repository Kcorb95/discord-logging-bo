const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const PremiumUsers = db.define("premiumUsers", {
  userID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  startDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  currentPledge: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  lifetimePledge: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  pledgeSource: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  isAFK: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  afkMessage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  mentionEmoji: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = PremiumUsers;
