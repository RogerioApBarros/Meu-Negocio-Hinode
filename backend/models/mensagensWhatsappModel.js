const {
    DataTypes
} = require("sequelize");

const sequelize = require(
    "../database/conexao"
);

const MensagemWhatsapp =
    sequelize.define(
        "MensagemWhatsapp",
        {
            titulo: {
                type: DataTypes.STRING,
                allowNull: false
            },

            texto: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            formaTratamento: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue:
                    "primeiro_nome"
            },

            ativa: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },

            ordem: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            }
        }
    );

module.exports =
    MensagemWhatsapp;