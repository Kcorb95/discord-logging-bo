const { db } = require('../struct/Database');
const Sequelize = require('sequelize');

const Users = db.define('users', {
    userID: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nameHistory: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
    }
});

module.exports = Users;