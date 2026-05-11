const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Log = sequelize.define('Log', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});

module.exports = Log;
