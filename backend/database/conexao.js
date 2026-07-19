require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,

        port: Number(
            process.env.DB_PORT
        ) || 3306,

        dialect: "mysql",

        logging:
            process.env.NODE_ENV === "development"
                ? console.log
                : false,

        define: {
            timestamps: true
        },

        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        dialectOptions:
            process.env.DB_SSL === "true"
                ? {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
                : {}
    }
);

module.exports = sequelize;