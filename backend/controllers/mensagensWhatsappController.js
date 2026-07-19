const MensagemWhatsapp = require(
    "../models/mensagensWhatsappModel"
);

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function limparTexto(valor) {
    return String(
        valor || ""
    ).trim();
}

function formaTratamentoValida(
    formaTratamento
) {
    const formasPermitidas = [
        "nome_completo",
        "primeiro_nome",
        "nome_fantasia_completo",
        "primeiro_nome_fantasia"
    ];

    return formasPermitidas.includes(
        formaTratamento
    );
}

function validarDadosMensagem(
    dados
) {
    const titulo =
        limparTexto(
            dados.titulo
        );

    const texto =
        limparTexto(
            dados.texto
        );

    const formaTratamento =
        limparTexto(
            dados.formaTratamento
        );

    if (!titulo) {
        return {
            valido: false,
            erro:
                "Informe o título da mensagem."
        };
    }

    if (!texto) {
        return {
            valido: false,
            erro:
                "Informe o texto da mensagem."
        };
    }

    if (
        !formaTratamentoValida(
            formaTratamento
        )
    ) {
        return {
            valido: false,
            erro:
                "A forma de tratamento é inválida."
        };
    }

    return {
        valido: true,

        dados: {
            titulo,
            texto,
            formaTratamento,

            ativa:
                dados.ativa !== false,

            ordem:
                Number(
                    dados.ordem
                ) || 1
        }
    };
}

/* =====================================================
   LISTAR MENSAGENS
===================================================== */

async function listarMensagens(
    req,
    res
) {
    try {
        const mensagens =
            await MensagemWhatsapp.findAll({
                order: [
                    [
                        "ordem",
                        "ASC"
                    ],

                    [
                        "titulo",
                        "ASC"
                    ]
                ]
            });

        return res.json(
            mensagens
        );

    } catch (erro) {
        console.error(
            "Erro ao listar mensagens:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao listar mensagens."
        });
    }
}

/* =====================================================
   LISTAR SOMENTE MENSAGENS ATIVAS
===================================================== */

async function listarMensagensAtivas(
    req,
    res
) {
    try {
        const mensagens =
            await MensagemWhatsapp.findAll({
                where: {
                    ativa: true
                },

                order: [
                    [
                        "ordem",
                        "ASC"
                    ],

                    [
                        "titulo",
                        "ASC"
                    ]
                ]
            });

        return res.json(
            mensagens
        );

    } catch (erro) {
        console.error(
            "Erro ao listar mensagens ativas:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao listar mensagens ativas."
        });
    }
}

/* =====================================================
   BUSCAR MENSAGEM POR ID
===================================================== */

async function buscarMensagemPorId(
    req,
    res
) {
    try {
        const id =
            Number(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                erro:
                    "O ID da mensagem é inválido."
            });
        }

        const mensagem =
            await MensagemWhatsapp.findByPk(
                id
            );

        if (!mensagem) {
            return res.status(404).json({
                erro:
                    "Mensagem não encontrada."
            });
        }

        return res.json(
            mensagem
        );

    } catch (erro) {
        console.error(
            "Erro ao buscar mensagem:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao buscar mensagem."
        });
    }
}

/* =====================================================
   CADASTRAR MENSAGEM
===================================================== */

async function cadastrarMensagem(
    req,
    res
) {
    try {
        const validacao =
            validarDadosMensagem(
                req.body
            );

        if (!validacao.valido) {
            return res.status(400).json({
                erro:
                    validacao.erro
            });
        }

        const mensagem =
            await MensagemWhatsapp.create(
                validacao.dados
            );

        return res.status(201).json({
            mensagem:
                "Mensagem cadastrada com sucesso!",

            dados:
                mensagem
        });

    } catch (erro) {
        console.error(
            "Erro ao cadastrar mensagem:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao cadastrar mensagem."
        });
    }
}

/* =====================================================
   ATUALIZAR MENSAGEM
===================================================== */

async function atualizarMensagem(
    req,
    res
) {
    try {
        const id =
            Number(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                erro:
                    "O ID da mensagem é inválido."
            });
        }

        const mensagem =
            await MensagemWhatsapp.findByPk(
                id
            );

        if (!mensagem) {
            return res.status(404).json({
                erro:
                    "Mensagem não encontrada."
            });
        }

        const validacao =
            validarDadosMensagem(
                req.body
            );

        if (!validacao.valido) {
            return res.status(400).json({
                erro:
                    validacao.erro
            });
        }

        await mensagem.update(
            validacao.dados
        );

        return res.json({
            mensagem:
                "Mensagem atualizada com sucesso!",

            dados:
                mensagem
        });

    } catch (erro) {
        console.error(
            "Erro ao atualizar mensagem:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao atualizar mensagem."
        });
    }
}

/* =====================================================
   ATIVAR OU DESATIVAR MENSAGEM
===================================================== */

async function alterarStatusMensagem(
    req,
    res
) {
    try {
        const id =
            Number(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                erro:
                    "O ID da mensagem é inválido."
            });
        }

        const mensagem =
            await MensagemWhatsapp.findByPk(
                id
            );

        if (!mensagem) {
            return res.status(404).json({
                erro:
                    "Mensagem não encontrada."
            });
        }

        const ativa =
            Boolean(
                req.body.ativa
            );

        mensagem.ativa =
            ativa;

        await mensagem.save();

        return res.json({
            mensagem:
                ativa
                    ? "Mensagem ativada com sucesso!"
                    : "Mensagem desativada com sucesso!",

            dados:
                mensagem
        });

    } catch (erro) {
        console.error(
            "Erro ao alterar status da mensagem:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao alterar o status da mensagem."
        });
    }
}

/* =====================================================
   EXCLUIR MENSAGEM
===================================================== */

async function excluirMensagem(
    req,
    res
) {
    try {
        const id =
            Number(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                erro:
                    "O ID da mensagem é inválido."
            });
        }

        const mensagem =
            await MensagemWhatsapp.findByPk(
                id
            );

        if (!mensagem) {
            return res.status(404).json({
                erro:
                    "Mensagem não encontrada."
            });
        }

        await mensagem.destroy();

        return res.json({
            mensagem:
                "Mensagem excluída com sucesso!"
        });

    } catch (erro) {
        console.error(
            "Erro ao excluir mensagem:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao excluir mensagem."
        });
    }
}

/* =====================================================
   EXPORTAÇÃO
===================================================== */

module.exports = {
    listarMensagens,
    listarMensagensAtivas,
    buscarMensagemPorId,
    cadastrarMensagem,
    atualizarMensagem,
    alterarStatusMensagem,
    excluirMensagem
};