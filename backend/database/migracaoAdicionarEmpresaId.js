const { DataTypes } = require("sequelize");
const sequelize = require("./conexao");

async function adicionarEmpresaIdUsuarios() {

    const queryInterface =
        sequelize.getQueryInterface();

    const tabela =
        await queryInterface.describeTable("usuarios");

    if (tabela.empresaId) {

        console.log(
            "empresaId já existe."
        );

        return;
    }

    console.log(
        "Criando coluna empresaId..."
    );

    await queryInterface.addColumn(
        "usuarios",
        "empresaId",
        {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    );

    console.log(
        "empresaId criada."
    );

}

module.exports =
    adicionarEmpresaIdUsuarios;