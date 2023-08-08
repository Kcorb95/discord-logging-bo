const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const GuildRoles = db.define("guildRoles", {
  guildID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  roleID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  groupID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = GuildRoles;
