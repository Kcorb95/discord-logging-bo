const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const Usernames = db.define("usernames", {
  userID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = Usernames;
