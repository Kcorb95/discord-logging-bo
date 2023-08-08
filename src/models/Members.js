const { db } = require('../struct/Database');
const Sequelize = require('sequelize');

const Members = db.define('members', {
    guildIDUserIDPair: { // 'userID.guildID'
        type: Sequelize.STRING,
        allowNull: false
    },
    joinDates: {
        type: Sequelize.ARRAY(Sequelize.DATE),
        allowNull: false,
        defaultValue: []
    },
    leaveDates: {
        type: Sequelize.ARRAY(Sequelize.DATE),
        allowNull: false,
        defaultValue: []
    },
    nameHistory: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
    },
    roleState: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
    }
});

module.exports = Members;