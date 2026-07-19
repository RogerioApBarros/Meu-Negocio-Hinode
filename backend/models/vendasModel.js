const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");

const Venda = sequelize.define("Venda", {
    cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },

    totalVenda: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    desconto: DataTypes.FLOAT,

    tipoDesconto: DataTypes.STRING,

    totalFinal: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    formaPagamento: DataTypes.STRING,

    tipoPagamento: DataTypes.STRING,

    primeiroVencimento: DataTypes.DATEONLY
});

module.exports = Venda;