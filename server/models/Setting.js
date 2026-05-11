const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    group: {
        type: DataTypes.STRING,
        defaultValue: 'general',
    }
});

module.exports = Setting;
