const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");

const Empresa = sequelize.define(
    "Empresa",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        nome: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "O nome da empresa é obrigatório."
                }
            }
        },

        responsavel: {
            type: DataTypes.STRING(120),
            allowNull: true
        },

        cpfCnpj: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true
        },

        telefone: {
            type: DataTypes.STRING(25),
            allowNull: true
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: true,
            validate: {
                isEmail: {
                    msg: "Informe um e-mail válido."
                }
            }
        },

        cep: {
            type: DataTypes.STRING(10),
            allowNull: true
        },

        logradouro: {
            type: DataTypes.STRING(180),
            allowNull: true
        },

        numero: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        bairro: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        cidade: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        estado: {
            type: DataTypes.STRING(2),
            allowNull: true
        },

        plano: {
            type: DataTypes.ENUM(
                "gratuito",
                "basico",
                "premium"
            ),
            allowNull: false,
            defaultValue: "gratuito"
        },

        dataVencimento: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM(
                "ativa",
                "bloqueada",
                "cancelada"
            ),
            allowNull: false,
            defaultValue: "ativa"
        }
    },
    {
        tableName: "empresas",
        timestamps: true,
        indexes: [
            {
                fields: ["nome"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["plano"]
            }
        ]
    }
);

module.exports = Empresa;
