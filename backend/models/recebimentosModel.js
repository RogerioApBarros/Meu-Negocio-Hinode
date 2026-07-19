const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");
const Venda = require("./vendasModel");

const Recebimento = sequelize.define("Recebimento", {

    cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },

    numeroParcela: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    valorParcela: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    valorRecebido: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    dataRecebimento: {
        type: DataTypes.DATEONLY
    },

    status: {
        type: DataTypes.STRING,
        defaultValue: "Aberta"
    },

    observacao: {
        type: DataTypes.STRING
    }

});

Venda.hasMany(Recebimento);
Recebimento.belongsTo(Venda);

module.exports = Recebimento;