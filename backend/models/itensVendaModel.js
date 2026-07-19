const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");
const Venda = require("./vendasModel");

const ItemVenda = sequelize.define("ItemVenda", {
    produto: {
        type: DataTypes.STRING,
        allowNull: false
    },

    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    valorUnitario: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    subtotal: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

Venda.hasMany(ItemVenda);
ItemVenda.belongsTo(Venda);

module.exports = ItemVenda;