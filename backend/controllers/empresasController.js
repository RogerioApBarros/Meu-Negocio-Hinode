const Empresa = require("../models/empresasModel");

function normalizarTexto(valor) {
    return String(valor || "").trim();
}

function formatarEmpresa(empresa) {
    return {
        id: empresa.id,
        nome: empresa.nome,
        responsavel: empresa.responsavel,
        cpfCnpj: empresa.cpfCnpj,
        telefone: empresa.telefone,
        email: empresa.email,
        cep: empresa.cep,
        logradouro: empresa.logradouro,
        numero: empresa.numero,
        bairro: empresa.bairro,
        cidade: empresa.cidade,
        estado: empresa.estado,
        plano: empresa.plano,
        dataVencimento: empresa.dataVencimento,
        status: empresa.status,
        createdAt: empresa.createdAt,
        updatedAt: empresa.updatedAt
    };
}

function tratarErro(erro, res) {
    if (erro.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
            sucesso: false,
            mensagem:
                "Já existe uma empresa cadastrada com este CPF ou CNPJ."
        });
    }

    if (erro.name === "SequelizeValidationError") {
        return res.status(400).json({
            sucesso: false,
            mensagem:
                erro.errors && erro.errors.length > 0
                    ? erro.errors[0].message
                    : "Dados inválidos."
        });
    }

    console.error("Erro no módulo de empresas:", erro);

    return res.status(500).json({
        sucesso: false,
        mensagem:
            "Erro interno ao processar os dados da empresa."
    });
}

async function cadastrar(req, res) {
    try {
        const nome = normalizarTexto(req.body.nome);

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome da empresa é obrigatório."
            });
        }

        const empresa = await Empresa.create({
            nome,
            responsavel:
                normalizarTexto(req.body.responsavel) || null,
            cpfCnpj:
                normalizarTexto(req.body.cpfCnpj) || null,
            telefone:
                normalizarTexto(req.body.telefone) || null,
            email:
                normalizarTexto(req.body.email).toLowerCase() || null,
            cep:
                normalizarTexto(req.body.cep) || null,
            logradouro:
                normalizarTexto(req.body.logradouro) || null,
            numero:
                normalizarTexto(req.body.numero) || null,
            bairro:
                normalizarTexto(req.body.bairro) || null,
            cidade:
                normalizarTexto(req.body.cidade) || null,
            estado:
                normalizarTexto(req.body.estado).toUpperCase() || null,
            plano:
                normalizarTexto(req.body.plano).toLowerCase() ||
                "gratuito",
            dataVencimento:
                req.body.dataVencimento || null,
            status:
                normalizarTexto(req.body.status).toLowerCase() ||
                "ativa"
        });

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Empresa cadastrada com sucesso.",
            empresa: formatarEmpresa(empresa)
        });
    } catch (erro) {
        return tratarErro(erro, res);
    }
}

async function listar(req, res) {
    try {
        const empresas = await Empresa.findAll({
            order: [
                ["nome", "ASC"]
            ]
        });

        return res.status(200).json({
            sucesso: true,
            quantidade: empresas.length,
            empresas: empresas.map(formatarEmpresa)
        });
    } catch (erro) {
        return tratarErro(erro, res);
    }
}

async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID da empresa inválido."
            });
        }

        const empresa = await Empresa.findByPk(id);

        if (!empresa) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Empresa não encontrada."
            });
        }

        return res.status(200).json({
            sucesso: true,
            empresa: formatarEmpresa(empresa)
        });
    } catch (erro) {
        return tratarErro(erro, res);
    }
}

async function atualizar(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID da empresa inválido."
            });
        }

        const empresa = await Empresa.findByPk(id);

        if (!empresa) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Empresa não encontrada."
            });
        }

        const campos = [
            "nome",
            "responsavel",
            "cpfCnpj",
            "telefone",
            "email",
            "cep",
            "logradouro",
            "numero",
            "bairro",
            "cidade",
            "estado",
            "plano",
            "dataVencimento",
            "status"
        ];

        campos.forEach(function (campo) {
            if (req.body[campo] !== undefined) {
                empresa[campo] = req.body[campo];
            }
        });

        empresa.nome = normalizarTexto(empresa.nome);

        if (!empresa.nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome da empresa não pode ficar vazio."
            });
        }

        if (empresa.email) {
            empresa.email =
                normalizarTexto(empresa.email).toLowerCase();
        }

        if (empresa.estado) {
            empresa.estado =
                normalizarTexto(empresa.estado).toUpperCase();
        }

        if (empresa.plano) {
            empresa.plano =
                normalizarTexto(empresa.plano).toLowerCase();
        }

        if (empresa.status) {
            empresa.status =
                normalizarTexto(empresa.status).toLowerCase();
        }

        await empresa.save();

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Empresa atualizada com sucesso.",
            empresa: formatarEmpresa(empresa)
        });
    } catch (erro) {
        return tratarErro(erro, res);
    }
}

async function alterarStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const status =
            normalizarTexto(req.body.status).toLowerCase();

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID da empresa inválido."
            });
        }

        if (
            ![
                "ativa",
                "bloqueada",
                "cancelada"
            ].includes(status)
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Status inválido."
            });
        }

        const empresa = await Empresa.findByPk(id);

        if (!empresa) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Empresa não encontrada."
            });
        }

        empresa.status = status;
        await empresa.save();

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Status da empresa atualizado com sucesso.",
            empresa: formatarEmpresa(empresa)
        });
    } catch (erro) {
        return tratarErro(erro, res);
    }
}

module.exports = {
    cadastrar,
    listar,
    buscarPorId,
    atualizar,
    alterarStatus
};
