const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");

const Cliente = sequelize.define("Cliente", {

    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },

    contato: DataTypes.STRING,

    rg: DataTypes.STRING,

    cpf: DataTypes.STRING,

    nascimento: DataTypes.DATEONLY,

    rua: DataTypes.STRING,

    numero: DataTypes.STRING,

    bairro: DataTypes.STRING,

    cidade: DataTypes.STRING,

    referencia: DataTypes.STRING,

    indicacao: DataTypes.STRING

});

module.exports = Cliente;