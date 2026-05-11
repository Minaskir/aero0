const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const JobApplication = sequelize.define('JobApplication', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    position: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    experience: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    info: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'interviewing', 'rejected', 'hired'),
        defaultValue: 'pending',
    },
});

module.exports = JobApplication;
