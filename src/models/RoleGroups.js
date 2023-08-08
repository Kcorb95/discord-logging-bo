const { db } = require("../struct/Database");
const Sequelize = require("sequelize");

const RoleGroups = db.define("roleGroups", {
  groupID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  },
  deepSync: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = RoleGroups;

// Info command for role & groupID to return sync/group info (GroupID, other roles in group including the guilds etc. and deep sync status)
// Accept multiple roles in add/remove commands
// deep sync toggle command
