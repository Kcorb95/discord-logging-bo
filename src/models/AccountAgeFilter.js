const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const AccountAgeFilter = db.define("accountAgeFilter", {
  guildID: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  accountAgeMinDays: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  whitelistedUserIDs: {
    type: Sequelize.ARRAY(Sequelize.JSON),
    allowNull: false,
    defaultValue: [],
    action: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "KICK",
    },
  },
  action: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "KICK", // or "BAN" (Possibly add "NOTIFY" later to alert in alerts channel)
  },
});

module.exports = AccountAgeFilter;
