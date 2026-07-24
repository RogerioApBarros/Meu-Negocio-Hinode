const Empresa = require("../models/empresasModel");
const Usuario = require("../models/usuariosModel");

function configurarAssociacoes() {
    Empresa.hasMany(
        Usuario,
        {
            foreignKey: "empresaId",
            as: "usuarios"
        }
    );

    Usuario.belongsTo(
        Empresa,
        {
            foreignKey: "empresaId",
            as: "empresa"
        }
    );
}

module.exports = configurarAssociacoes;
