const { db } = require('../struct/Database');
const Sequelize = require('sequelize');

const GuildPermissions = db.define('guildPermissions', {
    commandNameGuildIDPair: { // "commandName.guildID"
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    whitelist: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        default: false
    },
    roles: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        allowNull: false,
        default: []
    },
    channels: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        allowNull: false,
        default: []
    },
    members: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        allowNull: false,
        default: []

    }
});

module.exports = GuildPermissions;