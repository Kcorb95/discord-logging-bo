const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const Nicknames = db.define("nicknames", {
  userID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  guildID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  nickname: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = Nicknames;
