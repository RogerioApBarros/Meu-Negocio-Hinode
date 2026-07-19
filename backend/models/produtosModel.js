const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");

const Produto = sequelize.define("Produto", {
    nomeProduto: {
        type: DataTypes.STRING,
        allowNull: false
    },

    marca: DataTypes.STRING,

    custo: DataTypes.FLOAT,

    valorVenda: DataTypes.FLOAT,

    impostos: DataTypes.FLOAT,

    margemLucroBruto: DataTypes.FLOAT,

    margemLucroLiquido: DataTypes.FLOAT,

    quantidade: DataTypes.INTEGER
});

module.exports = Produto;