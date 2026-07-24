const { DataTypes } = require("sequelize");
const sequelize = require("../database/conexao");

const Usuario = sequelize.define(
    "Usuario",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        empresaId: {
    type: DataTypes.INTEGER,
    allowNull: true
},

        nome: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "O nome é obrigatório."
                }
            }
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: "O e-mail é obrigatório."
                },
                isEmail: {
                    msg: "Informe um e-mail válido."
                }
            }
        },

        login: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: "O login é obrigatório."
                },
                len: {
                    args: [3, 80],
                    msg: "O login deve possuir pelo menos 3 caracteres."
                }
            }
        },

        senha: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        perfil: {
            type: DataTypes.ENUM(
                "admin",
                "vendedor",
                "financeiro"
            ),
            allowNull: false,
            defaultValue: "vendedor"
        },

        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },

        ultimoAcesso: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: "usuarios",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: ["email"]
            },
            {
                unique: true,
                fields: ["login"]
            },
            {
                fields: ["ativo"]
            }
        ]
    }
);

module.exports = Usuario;