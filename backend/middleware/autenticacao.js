const jwt = require("jsonwebtoken");

function extrairToken(req) {
    const cabecalhoAutorizacao =
        req.headers.authorization;

    if (!cabecalhoAutorizacao) {
        return null;
    }

    const partes =
        cabecalhoAutorizacao.split(" ");

    if (
        partes.length !== 2 ||
        partes[0].toLowerCase() !== "bearer"
    ) {
        return null;
    }

    return partes[1];
}

function autenticar(req, res, next) {
    try {
        const token = extrairToken(req);

        if (!token) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Acesso não autorizado. Token não informado."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET não configurado no arquivo .env."
            );

            return res.status(500).json({
                sucesso: false,
                mensagem:
                    "Erro de configuração do servidor."
            });
        }

        const dadosToken =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.usuario = {
            id: dadosToken.id,
            nome: dadosToken.nome,
            email: dadosToken.email,
            login: dadosToken.login,
            perfil: dadosToken.perfil
        };

        return next();
    } catch (erro) {
        if (erro.name === "TokenExpiredError") {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Sua sessão expirou. Faça login novamente."
            });
        }

        if (erro.name === "JsonWebTokenError") {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Token de acesso inválido."
            });
        }

        console.error(
            "Erro na autenticação:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno de autenticação."
        });
    }
}

function permitirPerfis(...perfisPermitidos) {
    return function (req, res, next) {
        if (!req.usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário não autenticado."
            });
        }

        if (
            !perfisPermitidos.includes(
                req.usuario.perfil
            )
        ) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Você não possui permissão para realizar esta ação."
            });
        }

        return next();
    };
}

module.exports = {
    autenticar,
    permitirPerfis
};