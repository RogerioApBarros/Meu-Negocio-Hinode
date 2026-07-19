const { Op } = require("sequelize");

const Venda = require(
    "../models/vendasModel"
);

const ItemVenda = require(
    "../models/itensVendaModel"
);

const Recebimento = require(
    "../models/recebimentosModel"
);

const Produto = require(
    "../models/produtosModel"
);

const Cliente = require(
    "../models/clientes"
);

/* =====================================================
   FUNÇÕES GERAIS
===================================================== */

function arredondarCentavos(valor) {
    return (
        Math.round(
            Number(valor || 0) * 100
        ) / 100
    );
}

/* =====================================================
   FUNÇÕES DE DATA
===================================================== */

function criarDataLocal(dataTexto) {
    if (!dataTexto) {
        return null;
    }

    const partes = String(dataTexto)
        .split("-")
        .map(Number);

    if (partes.length !== 3) {
        return null;
    }

    const ano = partes[0];
    const mes = partes[1];
    const dia = partes[2];

    const data = new Date(
        ano,
        mes - 1,
        dia
    );

    if (
        data.getFullYear() !== ano ||
        data.getMonth() !== mes - 1 ||
        data.getDate() !== dia
    ) {
        return null;
    }

    return data;
}

function formatarDataBanco(data) {
    const ano =
        data.getFullYear();

    const mes = String(
        data.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function ultimoDiaDoMes(
    ano,
    mes
) {
    return new Date(
        ano,
        mes + 1,
        0
    ).getDate();
}

function criarDataComDia(
    ano,
    mes,
    diaDesejado
) {
    const ultimoDia =
        ultimoDiaDoMes(
            ano,
            mes
        );

    const diaValido =
        Math.min(
            Number(diaDesejado),
            ultimoDia
        );

    return new Date(
        ano,
        mes,
        diaValido
    );
}

function obterProximaDataPagamentoVale(
    dataAtual,
    diaPagamento,
    diaVale
) {
    const candidatos = [];

    for (
        let acrescimoMes = 0;
        acrescimoMes <= 2;
        acrescimoMes++
    ) {
        const base = new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth() +
                acrescimoMes,
            1
        );

        candidatos.push(
            criarDataComDia(
                base.getFullYear(),
                base.getMonth(),
                diaPagamento
            )
        );

        candidatos.push(
            criarDataComDia(
                base.getFullYear(),
                base.getMonth(),
                diaVale
            )
        );
    }

    candidatos.sort(
        function (a, b) {
            return a - b;
        }
    );

    return candidatos.find(
        function (data) {
            return data > dataAtual;
        }
    );
}

function gerarDatasParcelas(
    primeiroVencimento,
    quantidade,
    tipoPagamento,
    diaPagamento,
    diaVale
) {
    const dataInicial =
        criarDataLocal(
            primeiroVencimento
        );

    if (!dataInicial) {
        throw new Error(
            "A data do primeiro vencimento é inválida."
        );
    }

    const datas = [];

    let dataAtual =
        new Date(dataInicial);

    const diaPrimeiraParcela =
        dataAtual.getDate();

    for (
        let indice = 0;
        indice < quantidade;
        indice++
    ) {
        datas.push(
            formatarDataBanco(
                dataAtual
            )
        );

        if (
            tipoPagamento ===
            "semanal"
        ) {
            dataAtual.setDate(
                dataAtual.getDate() + 7
            );
        } else if (
            tipoPagamento ===
            "quinzenal"
        ) {
            dataAtual.setDate(
                dataAtual.getDate() + 15
            );
        } else if (
            tipoPagamento ===
            "mensal"
        ) {
            const proximoMes =
                new Date(
                    dataAtual.getFullYear(),
                    dataAtual.getMonth() + 1,
                    1
                );

            dataAtual =
                criarDataComDia(
                    proximoMes.getFullYear(),
                    proximoMes.getMonth(),
                    diaPrimeiraParcela
                );
        } else if (
            tipoPagamento ===
            "pagamento-vale"
        ) {
            dataAtual =
                obterProximaDataPagamentoVale(
                    dataAtual,
                    diaPagamento,
                    diaVale
                );
        } else {
            throw new Error(
                "Tipo de prazo inválido."
            );
        }
    }

    return datas;
}

/* =====================================================
   PARCELAMENTO
===================================================== */

function dividirParcelasExatas(
    totalCentavos,
    quantidade
) {
    const valorBase =
        Math.floor(
            totalCentavos /
                quantidade
        );

    const resto =
        totalCentavos %
        quantidade;

    const parcelas = [];

    for (
        let indice = 0;
        indice < quantidade;
        indice++
    ) {
        let centavos =
            valorBase;

        if (indice < resto) {
            centavos += 1;
        }

        parcelas.push(
            centavos / 100
        );
    }

    return parcelas;
}

/*
 * Regras personalizadas:
 *
 * R$ 230,00 em 3 parcelas:
 * R$ 75,00
 * R$ 75,00
 * R$ 80,00
 *
 * R$ 199,90 em 3 parcelas:
 * R$ 59,90
 * R$ 70,00
 * R$ 70,00
 */
function dividirValorEmParcelas(
    valorTotal,
    quantidadeParcelas
) {
    const totalCentavos =
        Math.round(
            Number(valorTotal) *
                100
        );

    const quantidade =
        Number(
            quantidadeParcelas
        );

    if (
        totalCentavos <= 0 ||
        !Number.isInteger(
            quantidade
        ) ||
        quantidade <= 0
    ) {
        throw new Error(
            "Quantidade de parcelas inválida."
        );
    }

    if (quantidade === 1) {
        return [
            totalCentavos / 100
        ];
    }

    const centavosDoTotal =
        totalCentavos % 100;

    const totalReais =
        totalCentavos / 100;

    const media =
        totalReais /
        quantidade;

    const parcelas = [];

    /*
     * Quando o valor total não tem centavos,
     * usa valores múltiplos de R$ 5,00.
     */
    if (
        centavosDoTotal === 0
    ) {
        const valorBase =
            Math.floor(
                media / 5
            ) * 5;

        if (valorBase <= 0) {
            return dividirParcelasExatas(
                totalCentavos,
                quantidade
            );
        }

        for (
            let indice = 0;
            indice <
                quantidade - 1;
            indice++
        ) {
            parcelas.push(
                valorBase
            );
        }

        const ultimaParcela =
            arredondarCentavos(
                totalReais -
                (
                    valorBase *
                    (
                        quantidade -
                        1
                    )
                )
            );

        if (
            ultimaParcela <= 0
        ) {
            return dividirParcelasExatas(
                totalCentavos,
                quantidade
            );
        }

        parcelas.push(
            ultimaParcela
        );

        return parcelas;
    }

    /*
     * Quando o total tem centavos,
     * as parcelas seguintes ficam arredondadas
     * e os centavos permanecem na primeira.
     */
    let valorRedondo =
        Math.round(
            media / 10
        ) * 10;

    if (valorRedondo <= 0) {
        return dividirParcelasExatas(
            totalCentavos,
            quantidade
        );
    }

    let primeiraParcela =
        arredondarCentavos(
            totalReais -
            (
                valorRedondo *
                (
                    quantidade -
                    1
                )
            )
        );

    if (
        primeiraParcela <= 0
    ) {
        valorRedondo =
            Math.floor(
                media / 10
            ) * 10;

        primeiraParcela =
            arredondarCentavos(
                totalReais -
                (
                    valorRedondo *
                    (
                        quantidade -
                        1
                    )
                )
            );
    }

    if (
        valorRedondo <= 0 ||
        primeiraParcela <= 0
    ) {
        return dividirParcelasExatas(
            totalCentavos,
            quantidade
        );
    }

    parcelas.push(
        primeiraParcela
    );

    for (
        let indice = 1;
        indice < quantidade;
        indice++
    ) {
        parcelas.push(
            valorRedondo
        );
    }

    return parcelas;
}

function gerarParcelasPorValor(
    valorTotal,
    valorParcelaDesejada
) {
    let restanteCentavos =
        Math.round(
            Number(valorTotal) *
                100
        );

    const parcelaCentavos =
        Math.round(
            Number(
                valorParcelaDesejada
            ) * 100
        );

    if (
        restanteCentavos <= 0 ||
        parcelaCentavos <= 0
    ) {
        throw new Error(
            "Valor da parcela inválido."
        );
    }

    const parcelas = [];

    while (
        restanteCentavos > 0
    ) {
        const valorAtual =
            Math.min(
                parcelaCentavos,
                restanteCentavos
            );

        parcelas.push(
            valorAtual / 100
        );

        restanteCentavos -=
            valorAtual;
    }

    return parcelas;
}

/* =====================================================
   CADASTRAR VENDA
===================================================== */

async function cadastrarVenda(
    req,
    res
) {
    try {
        const dados =
            req.body;

        const clienteId =
            Number(
                dados.clienteId
            );

        const clienteBanco =
            await Cliente.findByPk(
                clienteId
            );

        if (!clienteBanco) {
            return res.status(404).json({
                erro:
                    "Cliente não encontrado."
            });
        }

        if (
            !Array.isArray(
                dados.itens
            ) ||
            dados.itens.length === 0
        ) {
            return res.status(400).json({
                erro:
                    "Adicione pelo menos um produto."
            });
        }

        const totalFinal =
            arredondarCentavos(
                dados.totalFinal
            );

        const totalVenda =
            arredondarCentavos(
                dados.totalVenda
            );

        const valorRecebidoEntrada =
            arredondarCentavos(
                dados.valorRecebidoEntrada
            );

        let saldoParcelar =
            arredondarCentavos(
                dados.saldoParcelar
            );

        if (
            !Number.isFinite(
                totalFinal
            ) ||
            totalFinal <= 0
        ) {
            return res.status(400).json({
                erro:
                    "O total final da venda é inválido."
            });
        }

        if (
            dados.formaPagamento !==
                "avista" &&
            dados.formaPagamento !==
                "prazo"
        ) {
            return res.status(400).json({
                erro:
                    "Forma de pagamento inválida."
            });
        }

        /*
         * Confere o saldo com base no total
         * e no valor recebido.
         */
        saldoParcelar =
            arredondarCentavos(
                totalFinal -
                valorRecebidoEntrada
            );

        if (saldoParcelar < 0) {
            saldoParcelar = 0;
        }

        /*
         * Valida o estoque de todos os itens
         * antes de registrar a venda.
         */
        for (
            let indice = 0;
            indice < dados.itens.length;
            indice++
        ) {
            const item =
                dados.itens[indice];

            const produtoBanco =
                await Produto.findByPk(
                    item.produtoId
                );

            if (!produtoBanco) {
                return res.status(404).json({
                    erro:
                        "Produto não encontrado: " +
                        item.produto
                });
            }

            const quantidade =
                Number(
                    item.quantidade
                );

            if (
                !Number.isInteger(
                    quantidade
                ) ||
                quantidade <= 0
            ) {
                return res.status(400).json({
                    erro:
                        "Quantidade inválida para o produto " +
                        produtoBanco.nomeProduto
                });
            }

            if (
                Number(
                    produtoBanco.quantidade
                ) < quantidade
            ) {
                return res.status(400).json({
                    erro:
                        "Estoque insuficiente para o produto: " +
                        produtoBanco.nomeProduto
                });
            }
        }

        let valoresParcelas = [];
        let datasParcelas = [];

        /*
         * Venda a prazo.
         */
        if (
            dados.formaPagamento ===
            "prazo" &&
            saldoParcelar > 0
        ) {
            const tiposPermitidos = [
                "semanal",
                "quinzenal",
                "mensal",
                "pagamento-vale"
            ];

            if (
                !tiposPermitidos.includes(
                    dados.tipoPagamento
                )
            ) {
                return res.status(400).json({
                    erro:
                        "Tipo de prazo inválido."
                });
            }

            if (
                !dados.primeiroVencimento
            ) {
                return res.status(400).json({
                    erro:
                        "Informe a data da primeira parcela."
                });
            }

            let diaPagamento = null;
            let diaVale = null;

            if (
                dados.tipoPagamento ===
                "pagamento-vale"
            ) {
                diaPagamento =
                    Number(
                        dados.diaPagamento
                    );

                diaVale =
                    Number(
                        dados.diaVale
                    );

                if (
                    diaPagamento < 1 ||
                    diaPagamento > 31
                ) {
                    return res.status(400).json({
                        erro:
                            "Dia do pagamento inválido."
                    });
                }

                if (
                    diaVale < 1 ||
                    diaVale > 31
                ) {
                    return res.status(400).json({
                        erro:
                            "Dia do vale inválido."
                    });
                }

                if (
                    diaPagamento ===
                    diaVale
                ) {
                    return res.status(400).json({
                        erro:
                            "O dia do pagamento e o dia do vale devem ser diferentes."
                    });
                }
            }

            const valorParcelaDesejada =
                Number(
                    dados.valorParcelaDesejada
                );

            const quantidadeParcelas =
                Number(
                    dados.quantidadeParcelas
                );

            if (
                valorParcelaDesejada > 0
            ) {
                valoresParcelas =
                    gerarParcelasPorValor(
                        saldoParcelar,
                        valorParcelaDesejada
                    );
            } else {
                valoresParcelas =
                    dividirValorEmParcelas(
                        saldoParcelar,
                        quantidadeParcelas
                    );
            }

            datasParcelas =
                gerarDatasParcelas(
                    dados.primeiroVencimento,
                    valoresParcelas.length,
                    dados.tipoPagamento,
                    diaPagamento,
                    diaVale
                );
        }

        const venda =
            await Venda.create({
                cliente:
                    clienteBanco.nome,

                totalVenda,

                desconto:
                    Number(
                        dados.desconto || 0
                    ),

                tipoDesconto:
                    dados.tipoDesconto,

                totalFinal,

                formaPagamento:
                    dados.formaPagamento,

                tipoPagamento:
                    dados.tipoPagamento,

                primeiroVencimento:
                    dados.primeiroVencimento ||
                    null
            });

        /*
         * Salva os itens e reduz o estoque.
         */
        for (
            let indice = 0;
            indice < dados.itens.length;
            indice++
        ) {
            const item =
                dados.itens[indice];

            const produtoBanco =
                await Produto.findByPk(
                    item.produtoId
                );

            const quantidade =
                Number(
                    item.quantidade
                );

            const valorUnitario =
                Number(
                    produtoBanco.valorVenda
                );

            const subtotal =
                arredondarCentavos(
                    valorUnitario *
                    quantidade
                );

            await ItemVenda.create({
                produto:
                    produtoBanco.nomeProduto,

                quantidade,

                valorUnitario,

                subtotal,

                VendaId:
                    venda.id
            });

            produtoBanco.quantidade =
                Number(
                    produtoBanco.quantidade
                ) - quantidade;

            await produtoBanco.save();
        }

        const parcelasCriadas = [];

        /*
         * Registra a entrada, quando existir.
         */
        if (
            valorRecebidoEntrada > 0
        ) {
            const hoje =
                formatarDataBanco(
                    new Date()
                );

            const recebimentoEntrada =
                await Recebimento.create({
                    cliente:
                        clienteBanco.nome,

                    numeroParcela:
                        0,

                    valorParcela:
                        valorRecebidoEntrada,

                    valorRecebido:
                        valorRecebidoEntrada,

                    vencimento:
                        hoje,

                    dataRecebimento:
                        hoje,

                    status:
                        "Recebida",

                    observacao:
                        dados.formaPagamento ===
                        "avista"
                            ? "Venda à vista - " +
                              dados.tipoPagamento
                            : "Entrada da venda",

                    VendaId:
                        venda.id
                });

            parcelasCriadas.push(
                recebimentoEntrada
            );
        }

        /*
         * Venda à vista sem valor de entrada enviado.
         *
         * Considera toda a venda recebida.
         */
        if (
            dados.formaPagamento ===
                "avista" &&
            valorRecebidoEntrada <= 0
        ) {
            const hoje =
                formatarDataBanco(
                    new Date()
                );

            const recebimento =
                await Recebimento.create({
                    cliente:
                        clienteBanco.nome,

                    numeroParcela:
                        1,

                    valorParcela:
                        totalFinal,

                    valorRecebido:
                        totalFinal,

                    vencimento:
                        hoje,

                    dataRecebimento:
                        hoje,

                    status:
                        "Recebida",

                    observacao:
                        "Venda à vista - " +
                        dados.tipoPagamento,

                    VendaId:
                        venda.id
                });

            parcelasCriadas.push(
                recebimento
            );
        }

        /*
         * Venda a prazo.
         */
        if (
            dados.formaPagamento ===
                "prazo" &&
            saldoParcelar > 0
        ) {
            for (
                let indice = 0;
                indice <
                    valoresParcelas.length;
                indice++
            ) {
                let observacao =
                    null;

                if (
                    dados.tipoPagamento ===
                    "pagamento-vale"
                ) {
                    observacao =
                        "Pagamento e Vale: dias " +
                        dados.diaPagamento +
                        " e " +
                        dados.diaVale;
                }

                const recebimento =
                    await Recebimento.create({
                        cliente:
                            clienteBanco.nome,

                        numeroParcela:
                            indice + 1,

                        valorParcela:
                            valoresParcelas[
                                indice
                            ],

                        valorRecebido:
                            0,

                        vencimento:
                            datasParcelas[
                                indice
                            ],

                        dataRecebimento:
                            null,

                        status:
                            "Aberta",

                        observacao,

                        VendaId:
                            venda.id
                    });

                parcelasCriadas.push(
                    recebimento
                );
            }
        }

        return res.status(201).json({
            mensagem:
                "Venda registrada, parcelas geradas e estoque atualizado com sucesso!",

            venda,

            parcelas:
                parcelasCriadas.map(
                    function (
                        parcela
                    ) {
                        return {
                            id:
                                parcela.id,

                            numeroParcela:
                                parcela.numeroParcela,

                            valorParcela:
                                Number(
                                    parcela.valorParcela
                                ),

                            vencimento:
                                parcela.vencimento,

                            status:
                                parcela.status
                        };
                    }
                )
        });

    } catch (erro) {
        console.log(
            "Erro ao registrar venda:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro interno ao registrar venda."
        });
    }
}

/* =====================================================
   LISTAR VENDAS
===================================================== */

async function listarVendas(
    req,
    res
) {
    try {
        const vendas =
            await Venda.findAll({
                include: [
                    {
                        model:
                            ItemVenda
                    }
                ],

                order: [
                    [
                        "createdAt",
                        "DESC"
                    ]
                ]
            });

        return res.json(
            vendas
        );

    } catch (erro) {
        console.log(
            "Erro ao listar vendas:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro ao listar vendas."
        });
    }
}

/* =====================================================
   RESUMO DAS VENDAS POR PERÍODO
===================================================== */

async function resumoVendasPeriodo(
    req,
    res
) {
    try {
        const inicio =
            req.query.inicio;

        const fim =
            req.query.fim;

        if (!inicio || !fim) {
            return res.status(400).json({
                erro:
                    "Informe a data inicial e a data final."
            });
        }

        if (inicio > fim) {
            return res.status(400).json({
                erro:
                    "A data inicial não pode ser maior que a data final."
            });
        }

        const dataInicio =
            new Date(
                inicio +
                "T00:00:00"
            );

        const dataFim =
            new Date(
                fim +
                "T23:59:59.999"
            );

        if (
            Number.isNaN(
                dataInicio.getTime()
            ) ||
            Number.isNaN(
                dataFim.getTime()
            )
        ) {
            return res.status(400).json({
                erro:
                    "As datas informadas são inválidas."
            });
        }

        const filtroPeriodo = {
            createdAt: {
                [Op.between]: [
                    dataInicio,
                    dataFim
                ]
            }
        };

        /*
         * Soma o total final de todas as vendas
         * registradas no período.
         */
        const totalSomado =
            await Venda.sum(
                "totalFinal",
                {
                    where:
                        filtroPeriodo
                }
            );

        const quantidadeVendas =
            await Venda.count({
                where:
                    filtroPeriodo
            });

        const totalRealizado =
            arredondarCentavos(
                totalSomado || 0
            );

        const ticketMedio =
            quantidadeVendas > 0
                ? arredondarCentavos(
                    totalRealizado /
                    quantidadeVendas
                )
                : 0;

        return res.json({
            inicio,
            fim,
            totalRealizado,
            quantidadeVendas,
            ticketMedio
        });

    } catch (erro) {
        console.log(
            "Erro ao gerar resumo de vendas:",
            erro
        );

        return res.status(500).json({
            erro:
                erro.message ||
                "Erro interno ao consultar as vendas."
        });
    }
}

/* =====================================================
   EXPORTAÇÃO
===================================================== */

module.exports = {
    cadastrarVenda,
    listarVendas,
    resumoVendasPeriodo
};