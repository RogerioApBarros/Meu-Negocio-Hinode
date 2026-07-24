const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/usuariosModel");
const Empresa = require("../models/empresasModel");

function normalizarTexto(valor) {
    return String(valor || "").trim();
}

function normalizarEmail(valor) {
    return normalizarTexto(valor).toLowerCase();
}

function normalizarLogin(valor) {
    return normalizarTexto(valor).toLowerCase();
}

function validarSenhaForte(senha) {
    const senhaTexto = String(senha || "");

    return (
        senhaTexto.length >= 8 &&
        /[a-z]/.test(senhaTexto) &&
        /[A-Z]/.test(senhaTexto) &&
        /[0-9]/.test(senhaTexto) &&
        /[^A-Za-z0-9]/.test(senhaTexto)
    );
}

function gerarToken(usuario) {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET não foi configurado no arquivo .env."
        );
    }

    return jwt.sign(
        {
            id: usuario.id,
            empresaId: usuario.empresaId,
            nome: usuario.nome,
            email: usuario.email,
            login: usuario.login,
            perfil: usuario.perfil
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "8h"
        }
    );
}

function formatarUsuario(usuario) {
    return {
        id: usuario.id,
        empresaId: usuario.empresaId,
        nome: usuario.nome,
        email: usuario.email,
        login: usuario.login,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
        ultimoAcesso: usuario.ultimoAcesso,
        empresa:
            usuario.empresa || null,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
    };
}

function tratarErroSequelize(erro, res) {
    if (
        erro.name ===
        "SequelizeUniqueConstraintError"
    ) {
        const campo =
            erro.errors &&
            erro.errors.length > 0
                ? erro.errors[0].path
                : null;

        if (campo === "email") {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este e-mail já está cadastrado."
            });
        }

        if (campo === "login") {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este login já está sendo utilizado."
            });
        }

        return res.status(409).json({
            sucesso: false,
            mensagem:
                "Já existe um registro com esses dados."
        });
    }

    if (
        erro.name ===
        "SequelizeValidationError"
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem:
                erro.errors &&
                erro.errors.length > 0
                    ? erro.errors[0].message
                    : "Dados inválidos."
        });
    }

    console.error(
        "Erro no usuário:",
        erro
    );

    return res.status(500).json({
        sucesso: false,
        mensagem:
            "Erro interno do servidor."
    });
}

async function cadastrar(req, res) {
    try {
        const nome =
            normalizarTexto(req.body.nome);

        const email =
            normalizarEmail(req.body.email);

        const login =
            normalizarLogin(req.body.login);

        const senha =
            String(req.body.senha || "");

        const perfilSolicitado =
            normalizarTexto(
                req.body.perfil
            ).toLowerCase();

        if (
            !nome ||
            !email ||
            !login ||
            !senha
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Nome, e-mail, login e senha são obrigatórios."
            });
        }

        if (!validarSenhaForte(senha)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A senha deve possuir no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial."
            });
        }

        const usuarioExistente =
            await Usuario.findOne({
                where: {
                    login
                }
            });

        if (usuarioExistente) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este login já está sendo utilizado."
            });
        }

        const emailExistente =
            await Usuario.findOne({
                where: {
                    email
                }
            });

        if (emailExistente) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este e-mail já está cadastrado."
            });
        }

        const totalUsuarios =
            await Usuario.count();

        let perfil = "vendedor";
        let empresaId = null;

        /*
         * Compatibilidade com o primeiro cadastro do sistema.
         */
        if (totalUsuarios === 0) {
            perfil = "admin";

            const empresaInicial =
                await Empresa.findOne({
                    where: {
                        status: "ativa"
                    },
                    order: [
                        ["id", "ASC"]
                    ]
                });

            empresaId =
                empresaInicial
                    ? empresaInicial.id
                    : null;
        } else {
            if (
                !req.usuario ||
                req.usuario.perfil !== "admin"
            ) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem:
                        "Somente um administrador pode cadastrar novos usuários."
                });
            }

            empresaId =
                req.usuario.empresaId;

            if (
                [
                    "admin",
                    "vendedor",
                    "financeiro"
                ].includes(perfilSolicitado)
            ) {
                perfil =
                    perfilSolicitado;
            }
        }

        if (!empresaId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Não foi possível identificar a empresa do usuário."
            });
        }

        const senhaCriptografada =
            await bcrypt.hash(
                senha,
                12
            );

        const usuario =
            await Usuario.create({
                empresaId,
                nome,
                email,
                login,
                senha:
                    senhaCriptografada,
                perfil,
                ativo: true
            });

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Usuário cadastrado com sucesso.",
            usuario:
                formatarUsuario(usuario)
        });
    } catch (erro) {
        return tratarErroSequelize(
            erro,
            res
        );
    }
}

async function login(req, res) {
    try {
        const identificador =
            normalizarTexto(
                req.body.usuario ||
                req.body.login ||
                req.body.email
            ).toLowerCase();

        const senha =
            String(req.body.senha || "");

        if (!identificador || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe o usuário e a senha."
            });
        }

        let usuario =
            await Usuario.findOne({
                where: {
                    login:
                        identificador
                },
                include: [
                    {
                        model: Empresa,
                        as: "empresa",
                        attributes: [
                            "id",
                            "nome",
                            "plano",
                            "status",
                            "dataVencimento"
                        ]
                    }
                ]
            });

        if (!usuario) {
            usuario =
                await Usuario.findOne({
                    where: {
                        email:
                            identificador
                    },
                    include: [
                        {
                            model: Empresa,
                            as: "empresa",
                            attributes: [
                                "id",
                                "nome",
                                "plano",
                                "status",
                                "dataVencimento"
                            ]
                        }
                    ]
                });
        }

        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Usuário ou senha inválidos."
            });
        }

        if (!usuario.ativo) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Este usuário está desativado. Entre em contato com o administrador."
            });
        }

        if (!usuario.empresaId || !usuario.empresa) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Este usuário não está vinculado a uma empresa."
            });
        }

        if (
            usuario.empresa.status !==
            "ativa"
        ) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "O acesso desta empresa está bloqueado ou cancelado."
            });
        }

        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuario.senha
            );

        if (!senhaCorreta) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Usuário ou senha inválidos."
            });
        }

        usuario.ultimoAcesso =
            new Date();

        await usuario.save();

        const token =
            gerarToken(usuario);

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Login realizado com sucesso.",
            token,
            usuario:
                formatarUsuario(usuario)
        });
    } catch (erro) {
        console.error(
            "Erro ao fazer login:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao realizar login."
        });
    }
}

async function perfil(req, res) {
    try {
        const usuario =
            await Usuario.findOne({
                where: {
                    id:
                        req.usuario.id,
                    empresaId:
                        req.usuario.empresaId
                },
                include: [
                    {
                        model: Empresa,
                        as: "empresa",
                        attributes: [
                            "id",
                            "nome",
                            "plano",
                            "status",
                            "dataVencimento"
                        ]
                    }
                ]
            });

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Usuário não encontrado."
            });
        }

        if (!usuario.ativo) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Usuário desativado."
            });
        }

        return res.status(200).json({
            sucesso: true,
            usuario:
                formatarUsuario(usuario)
        });
    } catch (erro) {
        console.error(
            "Erro ao buscar perfil:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao buscar perfil."
        });
    }
}

async function listar(req, res) {
    try {
        const usuarios =
            await Usuario.findAll({
                where: {
                    empresaId:
                        req.usuario.empresaId
                },
                attributes: {
                    exclude: [
                        "senha"
                    ]
                },
                order: [
                    ["nome", "ASC"]
                ]
            });

        return res.status(200).json({
            sucesso: true,
            quantidade:
                usuarios.length,
            usuarios
        });
    } catch (erro) {
        console.error(
            "Erro ao listar usuários:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao listar usuários."
        });
    }
}

async function alterarStatus(req, res) {
    try {
        const id =
            Number(req.params.id);

        const ativo =
            req.body.ativo;

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do usuário inválido."
            });
        }

        if (
            typeof ativo !==
            "boolean"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O campo ativo deve ser verdadeiro ou falso."
            });
        }

        if (
            id === req.usuario.id &&
            ativo === false
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Você não pode desativar o próprio usuário."
            });
        }

        const usuario =
            await Usuario.findOne({
                where: {
                    id,
                    empresaId:
                        req.usuario.empresaId
                }
            });

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Usuário não encontrado."
            });
        }

        usuario.ativo = ativo;

        await usuario.save();

        return res.status(200).json({
            sucesso: true,
            mensagem:
                ativo
                    ? "Usuário ativado com sucesso."
                    : "Usuário desativado com sucesso.",
            usuario:
                formatarUsuario(usuario)
        });
    } catch (erro) {
        console.error(
            "Erro ao alterar status do usuário:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao alterar o status do usuário."
        });
    }
}

module.exports = {
    cadastrar,
    login,
    perfil,
    listar,
    alterarStatus
};
