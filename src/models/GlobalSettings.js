const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const GlobalSettings = db.define("globalSettings", {
  id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    primaryKey: true,
    allowNull: false,
  },
  dashboardErrorLogs: {
    type: Sequelize.STRING,
  },
});

module.exports = GlobalSettings;
