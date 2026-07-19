const { Op } = require("sequelize");

const Venda = require("../models/vendasModel");
const Recebimento = require("../models/recebimentosModel");
const ItemVenda = require("../models/itensVendaModel");
const Produto = require("../models/produtosModel");

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function arredondarCentavos(valor) {
    return Math.round(Number(valor || 0) * 100) / 100;
}

function dataAtualBanco() {
    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes = String(
        hoje.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoje.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function validarPeriodo(inicio, fim) {
    if (!inicio || !fim) {
        return "Informe a data inicial e a data final.";
    }

    if (inicio > fim) {
        return "A data inicial não pode ser maior que a data final.";
    }

    return null;
}

function criarFiltroStatusParcelas(status) {
    const hoje = dataAtualBanco();

    if (status === "pagas") {
        return {
            status: "Recebida"
        };
    }

    if (status === "abertas") {
        return {
            status: {
                [Op.ne]: "Recebida"
            }
        };
    }

    if (status === "vencidas") {
        return {
            status: {
                [Op.ne]: "Recebida"
            },

            vencimento: {
                [Op.lt]: hoje
            }
        };
    }

    return {};
}

function calcularResumoParcelas(parcelas) {
    let totalParcelas = 0;
    let totalRecebido = 0;
    let totalAberto = 0;

    parcelas.forEach(function (parcela) {
        const valorParcela = Number(
            parcela.valorParcela || 0
        );

        const valorRecebido = Number(
            parcela.valorRecebido || 0
        );

        totalParcelas += valorParcela;
        totalRecebido += valorRecebido;

        totalAberto += Math.max(
            0,
            valorParcela - valorRecebido
        );
    });

    return {
        totalParcelas:
            arredondarCentavos(
                totalParcelas
            ),

        totalRecebido:
            arredondarCentavos(
                totalRecebido
            ),

        totalAberto:
            arredondarCentavos(
                totalAberto
            )
    };
}

/* =====================================================
   PRODUTOS MAIS VENDIDOS
===================================================== */

async function produtosMaisVendidos(req, res) {
    try {
        const itens = await ItemVenda.findAll();

        const ranking = {};

        itens.forEach(function (item) {
            const nomeProduto =
                item.produto || "Produto não informado";

            if (!ranking[nomeProduto]) {
                ranking[nomeProduto] = 0;
            }

            ranking[nomeProduto] += Number(
                item.quantidade || 0
            );
        });

        const resultado = Object.keys(
            ranking
        ).map(function (produto) {
            return {
                produto,
                quantidade: ranking[produto]
            };
        });

        resultado.sort(function (a, b) {
            return b.quantidade - a.quantidade;
        });

        return res.json(resultado);

    } catch (erro) {
        console.error(
            "Erro em produtosMaisVendidos:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar produtos mais vendidos."
        });
    }
}

/* =====================================================
   CLIENTES QUE MAIS COMPRAM
===================================================== */

async function clientesMaisCompram(req, res) {
    try {
        const vendas = await Venda.findAll();

        const ranking = {};

        vendas.forEach(function (venda) {
            const cliente =
                venda.cliente ||
                "Cliente não informado";

            if (!ranking[cliente]) {
                ranking[cliente] = 0;
            }

            ranking[cliente] += Number(
                venda.totalFinal || 0
            );
        });

        const resultado = Object.keys(
            ranking
        ).map(function (cliente) {
            return {
                cliente,

                totalComprado:
                    arredondarCentavos(
                        ranking[cliente]
                    )
            };
        });

        resultado.sort(function (a, b) {
            return (
                b.totalComprado -
                a.totalComprado
            );
        });

        return res.json(resultado);

    } catch (erro) {
        console.error(
            "Erro em clientesMaisCompram:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar clientes."
        });
    }
}

/* =====================================================
   PARCELAS EM ATRASO
===================================================== */

async function parcelasEmAtraso(req, res) {
    try {
        const hojeTexto =
            dataAtualBanco();

        const hoje = new Date(
            hojeTexto + "T00:00:00"
        );

        const parcelas =
            await Recebimento.findAll({
                where: {
                    status: {
                        [Op.ne]: "Recebida"
                    },

                    vencimento: {
                        [Op.lt]: hojeTexto
                    }
                },

                order: [
                    [
                        "vencimento",
                        "ASC"
                    ]
                ]
            });

        const resultado = parcelas.map(
            function (parcela) {
                const dataVencimento =
                    new Date(
                        parcela.vencimento +
                        "T00:00:00"
                    );

                const diasAtraso =
                    Math.floor(
                        (
                            hoje -
                            dataVencimento
                        ) /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    );

                const saldo =
                    Math.max(
                        0,

                        Number(
                            parcela.valorParcela ||
                            0
                        ) -
                        Number(
                            parcela.valorRecebido ||
                            0
                        )
                    );

                return {
                    cliente:
                        parcela.cliente,

                    parcela:
                        parcela.numeroParcela,

                    vencimento:
                        parcela.vencimento,

                    valor:
                        Number(
                            parcela.valorParcela ||
                            0
                        ),

                    valorRecebido:
                        Number(
                            parcela.valorRecebido ||
                            0
                        ),

                    saldo:
                        arredondarCentavos(
                            saldo
                        ),

                    status:
                        parcela.status,

                    diasAtraso
                };
            }
        );

        return res.json(resultado);

    } catch (erro) {
        console.error(
            "Erro em parcelasEmAtraso:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar parcelas em atraso."
        });
    }
}

/* =====================================================
   PARCELAS POR PERÍODO
===================================================== */

async function parcelasPorPeriodo(req, res) {
    try {
        const {
            inicio,
            fim,
            status = "todas"
        } = req.query;

        const erroPeriodo =
            validarPeriodo(
                inicio,
                fim
            );

        if (erroPeriodo) {
            return res.status(400).json({
                erro: erroPeriodo
            });
        }

        const filtro = {
            vencimento: {
                [Op.between]: [
                    inicio,
                    fim
                ]
            },

            ...criarFiltroStatusParcelas(
                status
            )
        };

        if (status === "vencidas") {
            const hoje =
                dataAtualBanco();

            const limiteFinal =
                fim < hoje
                    ? fim
                    : hoje;

            filtro.vencimento = {
                [Op.between]: [
                    inicio,
                    limiteFinal
                ],

                [Op.lt]: hoje
            };
        }

        const parcelas =
            await Recebimento.findAll({
                where: filtro,

                order: [
                    [
                        "vencimento",
                        "ASC"
                    ]
                ]
            });

        const resumo =
            calcularResumoParcelas(
                parcelas
            );

        return res.json({
            inicio,
            fim,
            status,

            quantidadeParcelas:
                parcelas.length,

            ...resumo,

            parcelas
        });

    } catch (erro) {
        console.error(
            "Erro em parcelasPorPeriodo:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar parcelas por período."
        });
    }
}

/* =====================================================
   PARCELAS POR CLIENTE
===================================================== */

async function parcelasPorCliente(req, res) {
    try {
        const {
            cliente,
            status = "todas"
        } = req.query;

        if (!cliente) {
            return res.status(400).json({
                erro:
                    "Selecione um cliente."
            });
        }

        const filtro = {
            cliente,

            ...criarFiltroStatusParcelas(
                status
            )
        };

        const parcelas =
            await Recebimento.findAll({
                where: filtro,

                order: [
                    [
                        "vencimento",
                        "ASC"
                    ]
                ]
            });

        const resumo =
            calcularResumoParcelas(
                parcelas
            );

        return res.json({
            cliente,
            status,

            quantidadeParcelas:
                parcelas.length,

            ...resumo,

            parcelas
        });

    } catch (erro) {
        console.error(
            "Erro em parcelasPorCliente:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar parcelas do cliente."
        });
    }
}

/* =====================================================
   HISTÓRICO FINANCEIRO DO CLIENTE
===================================================== */

async function historicoFinanceiroCliente(req, res) {
    try {
        const {
            cliente
        } = req.query;

        if (!cliente) {
            return res.status(400).json({
                erro:
                    "Selecione um cliente."
            });
        }

        const vendas =
            await Venda.findAll({
                where: {
                    cliente
                },

                order: [
                    [
                        "createdAt",
                        "DESC"
                    ]
                ]
            });

        const recebimentos =
            await Recebimento.findAll({
                where: {
                    cliente
                },

                order: [
                    [
                        "vencimento",
                        "ASC"
                    ]
                ]
            });

        let totalComprado = 0;

        vendas.forEach(function (venda) {
            totalComprado += Number(
                venda.totalFinal || 0
            );
        });

        const resumoRecebimentos =
            calcularResumoParcelas(
                recebimentos
            );

        return res.json({
            cliente,

            totalComprado:
                arredondarCentavos(
                    totalComprado
                ),

            totalRecebido:
                resumoRecebimentos
                    .totalRecebido,

            totalAberto:
                resumoRecebimentos
                    .totalAberto,

            quantidadeCompras:
                vendas.length,

            vendas,
            recebimentos
        });

    } catch (erro) {
        console.error(
            "Erro em historicoFinanceiroCliente:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar histórico financeiro."
        });
    }
}

/* =====================================================
   RESUMO FINANCEIRO
===================================================== */

async function resumoFinanceiro(req, res) {
    try {
        const vendas =
            await Venda.findAll();

        const recebimentos =
            await Recebimento.findAll();

        const produtos =
            await Produto.findAll();

        let totalVendido = 0;
        let totalRecebido = 0;
        let totalAberto = 0;
        let totalVencido = 0;
        let estoqueCusto = 0;
        let estoqueVenda = 0;

        const hoje =
            dataAtualBanco();

        vendas.forEach(function (venda) {
            totalVendido += Number(
                venda.totalFinal || 0
            );
        });

        recebimentos.forEach(
            function (parcela) {
                const valorParcela =
                    Number(
                        parcela.valorParcela ||
                        0
                    );

                const valorRecebido =
                    Number(
                        parcela.valorRecebido ||
                        0
                    );

                totalRecebido +=
                    valorRecebido;

                const saldo =
                    Math.max(
                        0,
                        valorParcela -
                        valorRecebido
                    );

                if (
                    parcela.status !==
                    "Recebida"
                ) {
                    totalAberto += saldo;

                    if (
                        parcela.vencimento <
                        hoje
                    ) {
                        totalVencido += saldo;
                    }
                }
            }
        );

        produtos.forEach(
            function (produto) {
                estoqueCusto +=
                    Number(
                        produto.custo || 0
                    ) *
                    Number(
                        produto.quantidade || 0
                    );

                estoqueVenda +=
                    Number(
                        produto.valorVenda ||
                        0
                    ) *
                    Number(
                        produto.quantidade ||
                        0
                    );
            }
        );

        return res.json({
            totalVendido:
                arredondarCentavos(
                    totalVendido
                ),

            totalRecebido:
                arredondarCentavos(
                    totalRecebido
                ),

            totalAberto:
                arredondarCentavos(
                    totalAberto
                ),

            totalVencido:
                arredondarCentavos(
                    totalVencido
                ),

            estoqueCusto:
                arredondarCentavos(
                    estoqueCusto
                ),

            estoqueVenda:
                arredondarCentavos(
                    estoqueVenda
                ),

            lucroBrutoPrevisto:
                arredondarCentavos(
                    estoqueVenda -
                    estoqueCusto
                )
        });

    } catch (erro) {
        console.error(
            "Erro em resumoFinanceiro:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao gerar resumo financeiro."
        });
    }
}

/* =====================================================
   VENDAS POR PERÍODO
===================================================== */

async function vendasPorPeriodo(req, res) {
    try {
        const {
            inicio,
            fim
        } = req.query;

        const erroPeriodo =
            validarPeriodo(
                inicio,
                fim
            );

        if (erroPeriodo) {
            return res.status(400).json({
                erro:
                    erroPeriodo
            });
        }

        const vendas =
            await Venda.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [
                            inicio +
                            " 00:00:00",

                            fim +
                            " 23:59:59"
                        ]
                    }
                },

                order: [
                    [
                        "createdAt",
                        "DESC"
                    ]
                ]
            });

        let totalVendas = 0;

        vendas.forEach(function (venda) {
            totalVendas += Number(
                venda.totalFinal || 0
            );
        });

        totalVendas =
            arredondarCentavos(
                totalVendas
            );

        const quantidadeVendas =
            vendas.length;

        const ticketMedio =
            quantidadeVendas > 0
                ? arredondarCentavos(
                    totalVendas /
                    quantidadeVendas
                )
                : 0;

        return res.json({
            inicio,
            fim,
            totalVendas,
            quantidadeVendas,
            ticketMedio,
            vendas
        });

    } catch (erro) {
        console.error(
            "Erro em vendasPorPeriodo:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar vendas por período."
        });
    }
}

/* =====================================================
   VENDAS POR CLIENTE E PERÍODO
===================================================== */

async function vendasClientePorPeriodo(
    req,
    res
) {
    try {
        const {
            cliente,
            inicio,
            fim
        } = req.query;

        if (!cliente) {
            return res.status(400).json({
                erro:
                    "Selecione um cliente."
            });
        }

        const erroPeriodo =
            validarPeriodo(
                inicio,
                fim
            );

        if (erroPeriodo) {
            return res.status(400).json({
                erro:
                    erroPeriodo
            });
        }

        const vendas =
            await Venda.findAll({
                where: {
                    cliente,

                    createdAt: {
                        [Op.between]: [
                            inicio +
                            " 00:00:00",

                            fim +
                            " 23:59:59"
                        ]
                    }
                },

                order: [
                    [
                        "createdAt",
                        "DESC"
                    ]
                ]
            });

        let totalVendas = 0;

        vendas.forEach(function (venda) {
            totalVendas += Number(
                venda.totalFinal || 0
            );
        });

        totalVendas =
            arredondarCentavos(
                totalVendas
            );

        const quantidadeVendas =
            vendas.length;

        const ticketMedio =
            quantidadeVendas > 0
                ? arredondarCentavos(
                    totalVendas /
                    quantidadeVendas
                )
                : 0;

        return res.json({
            cliente,
            inicio,
            fim,
            totalVendas,
            quantidadeVendas,
            ticketMedio,
            vendas
        });

    } catch (erro) {
        console.error(
            "Erro em vendasClientePorPeriodo:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar vendas do cliente."
        });
    }
}

/* =====================================================
   RECEBIMENTOS POR PERÍODO
===================================================== */

async function recebimentosPorPeriodo(
    req,
    res
) {
    try {
        const {
            inicio,
            fim
        } = req.query;

        const erroPeriodo =
            validarPeriodo(
                inicio,
                fim
            );

        if (erroPeriodo) {
            return res.status(400).json({
                erro:
                    erroPeriodo
            });
        }

        const recebimentos =
            await Recebimento.findAll({
                where: {
                    status:
                        "Recebida",

                    dataRecebimento: {
                        [Op.between]: [
                            inicio,
                            fim
                        ]
                    }
                },

                order: [
                    [
                        "dataRecebimento",
                        "DESC"
                    ]
                ]
            });

        let totalRecebido = 0;

        recebimentos.forEach(
            function (item) {
                totalRecebido += Number(
                    item.valorRecebido || 0
                );
            }
        );

        return res.json({
            inicio,
            fim,

            totalRecebido:
                arredondarCentavos(
                    totalRecebido
                ),

            quantidadeRecebimentos:
                recebimentos.length,

            recebimentos
        });

    } catch (erro) {
        console.error(
            "Erro em recebimentosPorPeriodo:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao consultar recebimentos por período."
        });
    }
}

/* =====================================================
   EXPORTAÇÃO
===================================================== */

module.exports = {
    produtosMaisVendidos,
    clientesMaisCompram,
    parcelasEmAtraso,
    parcelasPorPeriodo,
    parcelasPorCliente,
    historicoFinanceiroCliente,
    resumoFinanceiro,
    vendasPorPeriodo,
    vendasClientePorPeriodo,
    recebimentosPorPeriodo
};