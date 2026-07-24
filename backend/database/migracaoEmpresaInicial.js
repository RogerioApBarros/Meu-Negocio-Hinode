const Empresa = require("../models/empresasModel");
const Usuario = require("../models/usuariosModel");

async function criarEmpresaInicial() {

    const [empresa] = await Empresa.findOrCreate({
        where: {
            nome: "Rogério Barros"
        },
        defaults: {
            nome: "Rogério Barros",
            plano: "premium",
            status: "ativa"
        }
    });

    const usuarios =
        await Usuario.findAll({
            where: {
                empresaId: null
            }
        });

    for (const usuario of usuarios) {

        usuario.empresaId = empresa.id;

        await usuario.save();

    }

    console.log(
        "Empresa inicial verificada."
    );

}

module.exports =
    criarEmpresaInicial;