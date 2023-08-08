const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const InviteFilters = db.define("inviteFilters", {
  guildID: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  whitelist: {
    type: Sequelize.ARRAY(Sequelize.STRING), // array of guildIDs for which invites are allowed
    defaultValue: [],
  },
  action: {
    type: Sequelize.STRING, //  MUTE | KICK |  BAN
    allowNull: false,
    defaultValue: "MUTE",
  },
  pruneDurationDays: {
    type: Sequelize.INTEGER, // In days
    allowNull: false,
    defaultValue: 0,
  },
  muteDurationMins: {
    type: Sequelize.INTEGER, // In minutes
    allowNull: false,
    defaultValue: 10,
  },
});

module.exports = InviteFilters;
