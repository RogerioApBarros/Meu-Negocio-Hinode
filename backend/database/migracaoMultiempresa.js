const { DataTypes, Op } = require("sequelize");

const sequelize = require("./conexao");
const Empresa = require("../models/empresasModel");
const Usuario = require("../models/usuariosModel");

/*
 * Migração segura e repetível.
 *
 * 1. Adiciona empresaId à tabela usuarios, caso ainda não exista.
 * 2. Cria a empresa inicial, caso ainda não exista.
 * 3. Vincula à empresa inicial os usuários antigos sem empresa.
 *
 * Após toda a transformação multiempresa ser concluída,
 * esta rotina poderá ser removida do server.js.
 */
async function executarMigracaoMultiempresa() {
    const queryInterface =
        sequelize.getQueryInterface();

    const tabelaUsuarios =
        await queryInterface.describeTable(
            "usuarios"
        );

    if (!tabelaUsuarios.empresaId) {
        console.log(
            "Adicionando empresaId à tabela usuarios..."
        );

        await queryInterface.addColumn(
            "usuarios",
            "empresaId",
            {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "empresas",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT"
            }
        );

        await queryInterface.addIndex(
            "usuarios",
            ["empresaId"],
            {
                name: "usuarios_empresa_id"
            }
        );

        console.log(
            "Coluna empresaId adicionada com sucesso."
        );
    }

    const nomeEmpresaInicial =
        String(
            process.env.EMPRESA_INICIAL_NOME ||
            "Rogério Barros"
        ).trim();

    const responsavelEmpresaInicial =
        String(
            process.env.EMPRESA_INICIAL_RESPONSAVEL ||
            "Rogério Barros"
        ).trim();

    const [
        empresaInicial,
        empresaCriada
    ] = await Empresa.findOrCreate({
        where: {
            nome: nomeEmpresaInicial
        },
        defaults: {
            nome: nomeEmpresaInicial,
            responsavel:
                responsavelEmpresaInicial,
            plano: "premium",
            status: "ativa"
        }
    });

    if (empresaCriada) {
        console.log(
            `Empresa inicial criada: ${empresaInicial.nome}`
        );
    }

    const [
        quantidadeAtualizada
    ] = await Usuario.update(
        {
            empresaId: empresaInicial.id
        },
        {
            where: {
                empresaId: {
                    [Op.is]: null
                }
            }
        }
    );

    if (quantidadeAtualizada > 0) {
        console.log(
            `${quantidadeAtualizada} usuário(s) vinculado(s) à empresa inicial.`
        );
    }

    console.log(
        `Empresa inicial ativa: ${empresaInicial.nome} (ID ${empresaInicial.id})`
    );
}

module.exports =
    executarMigracaoMultiempresa;
