const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    items: {
        type: DataTypes.JSONB, // Храним массив объектов [{name, price, count}]
        allowNull: false,
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    paymentMethod: {
        type: DataTypes.ENUM('card', 'qr'),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
        defaultValue: 'paid', // В нашем случае считаем, что после "оплаты" он оплачен
    },
});

module.exports = Order;
