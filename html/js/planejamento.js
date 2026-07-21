
/* =====================================================
   FORMATAÇÃO
===================================================== */

function moeda(valor) {
    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

function arredondarCentavos(
    valor
) {
    return (
        Math.round(
            Number(valor || 0) *
            100
        ) / 100
    );
}

/* =====================================================
   DATAS
===================================================== */

function criarDataLocal(
    dataTexto
) {
    if (!dataTexto) {
        return null;
    }

    const partes =
        String(dataTexto)
            .split("-")
            .map(Number);

    if (partes.length !== 3) {
        return null;
    }

    const ano =
        partes[0];

    const mes =
        partes[1];

    const dia =
        partes[2];

    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    if (
        data.getFullYear() !== ano ||
        data.getMonth() !==
            mes - 1 ||
        data.getDate() !== dia
    ) {
        return null;
    }

    return data;
}

/*
 * Conta todos os dias do período,
 * retirando somente os domingos.
 */
function contarDiasUteis(
    dataInicio,
    dataFim
) {
    let inicio =
        criarDataLocal(
            dataInicio
        );

    const fim =
        criarDataLocal(
            dataFim
        );

    if (!inicio || !fim) {
        return 0;
    }

    let total = 0;

    while (
        inicio <= fim
    ) {
        /*
         * Domingo corresponde ao dia 0.
         */
        if (
            inicio.getDay() !== 0
        ) {
            total++;
        }

        inicio.setDate(
            inicio.getDate() + 1
        );
    }

    return total;
}

/*
 * Conta os dias restantes de hoje até
 * o final do planejamento, retirando
 * somente os domingos.
 */
function contarDiasUteisRestantes(
    dataInicio,
    dataFim
) {
    const inicio =
        criarDataLocal(
            dataInicio
        );

    const fim =
        criarDataLocal(
            dataFim
        );

    if (!inicio || !fim) {
        return 0;
    }

    const hoje =
        new Date();

    hoje.setHours(
        0,
        0,
        0,
        0
    );

    let dataBase;

    /*
     * Se o planejamento ainda não começou,
     * conta a partir da data inicial.
     *
     * Se já começou, conta a partir de hoje.
     */
    if (hoje < inicio) {
        dataBase =
            new Date(inicio);
    } else {
        dataBase =
            new Date(hoje);
    }

    if (
        dataBase > fim
    ) {
        return 0;
    }

    let total = 0;

    while (
        dataBase <= fim
    ) {
        if (
            dataBase.getDay() !== 0
        ) {
            total++;
        }

        dataBase.setDate(
            dataBase.getDate() + 1
        );
    }

    return total;
}

/* =====================================================
   BUSCAR VENDAS NO BANCO
===================================================== */

async function buscarRealizado(
    dataInicio,
    dataFim
) {
    const rota =
        "/vendas/resumo-periodo" +
        `?inicio=${encodeURIComponent(dataInicio)}` +
        `&fim=${encodeURIComponent(dataFim)}`;

    const dados =
        await window.API.requisicao(
            rota
        );

    return {
        realizado:
            Number(
                dados.totalRealizado ||
                dados.realizado ||
                0
            ),

        quantidadeVendas:
            Number(
                dados.quantidadeVendas ||
                0
            ),

        ticketMedio:
            Number(
                dados.ticketMedio ||
                0
            )
    };
}

/* =====================================================
   VALIDAR FORMULÁRIO
===================================================== */

function obterDadosFormulario() {
    const meta =
        Number(
            document.getElementById(
                "meta"
            ).value
        );

    const margem =
        Number(
            document.getElementById(
                "margem"
            ).value
        );

    const dataInicio =
        document.getElementById(
            "data-inicio"
        ).value;

    const dataFim =
        document.getElementById(
            "data-fim"
        ).value;

    return {
        meta,
        margem,
        dataInicio,
        dataFim
    };
}

function validarFormulario(
    dados,
    mostrarMensagem
) {
    if (
        dados.meta <= 0 ||
        dados.margem <= 0 ||
        dados.dataInicio === "" ||
        dados.dataFim === ""
    ) {
        if (mostrarMensagem) {
            alert(
                "Preencha meta, margem, data inicial e data final."
            );
        }

        return false;
    }

    if (
        dados.margem > 100
    ) {
        if (mostrarMensagem) {
            alert(
                "A margem não pode ser maior que 100%."
            );
        }

        return false;
    }

    if (
        dados.dataInicio >
        dados.dataFim
    ) {
        if (mostrarMensagem) {
            alert(
                "A data inicial não pode ser maior que a data final."
            );
        }

        return false;
    }

    return true;
}

/* =====================================================
   CALCULAR PLANEJAMENTO
===================================================== */

async function calcularPlanejamento(
    mostrarMensagemErro = true
) {
    const dadosFormulario =
        obterDadosFormulario();

    if (
        !validarFormulario(
            dadosFormulario,
            mostrarMensagemErro
        )
    ) {
        return;
    }

    const botaoCalcular =
        document.querySelector(
            ".formulario button:not(.botao-reset)"
        );

    if (botaoCalcular) {
        botaoCalcular.disabled =
            true;

        botaoCalcular.textContent =
            "Atualizando...";
    }

    try {
        const meta =
            dadosFormulario.meta;

        const margem =
            dadosFormulario.margem;

        const dataInicio =
            dadosFormulario.dataInicio;

        const dataFim =
            dadosFormulario.dataFim;

        const diasUteis =
            contarDiasUteis(
                dataInicio,
                dataFim
            );

        const diasRestantes =
            contarDiasUteisRestantes(
                dataInicio,
                dataFim
            );

        /*
         * Consulta o banco de dados.
         */
        const resumoVendas =
            await buscarRealizado(
                dataInicio,
                dataFim
            );

        const realizado =
            arredondarCentavos(
                resumoVendas.realizado
            );

        /*
         * Desconta o que já foi vendido
         * da meta mensal.
         */
        let resta =
            arredondarCentavos(
                meta -
                realizado
            );

        if (
            resta < 0
        ) {
            resta = 0;
        }

        /*
         * Divide o valor restante pelos
         * dias úteis que ainda restam.
         */
        let metaDiaria = 0;

        if (
            diasRestantes > 0 &&
            resta > 0
        ) {
            metaDiaria =
                arredondarCentavos(
                    resta /
                    diasRestantes
                );
        }

        const margemDecimal =
            margem / 100;

        /*
         * Estoque necessário para atingir
         * apenas o faturamento que ainda falta.
         */
        const estoqueNecessario =
            arredondarCentavos(
                resta *
                (
                    1 -
                    margemDecimal
                )
            );

        /*
         * Lucro previsto sobre a meta completa.
         */
        const lucroPrevisto =
            arredondarCentavos(
                meta *
                margemDecimal
            );

        const planejamento = {
            meta:
                arredondarCentavos(
                    meta
                ),

            margem,
            dataInicio,
            dataFim,
            diasUteis,
            diasRestantes,
            realizado,
            resta,
            metaDiaria,
            estoqueNecessario,
            lucroPrevisto,

            quantidadeVendas:
                resumoVendas.quantidadeVendas,

            ticketMedio:
                resumoVendas.ticketMedio,

            atualizadoEm:
                new Date()
                    .toISOString()
        };

        localStorage.setItem(
            "planejamentoAtual",
            JSON.stringify(
                planejamento
            )
        );

        mostrarPlanejamento(
            planejamento
        );

    } catch (erro) {
        console.error(
            "Erro ao calcular planejamento:",
            erro
        );

        alert(
            "Não foi possível atualizar o planejamento.\n\n" +
            erro.message
        );

    } finally {
        if (botaoCalcular) {
            botaoCalcular.disabled =
                false;

            botaoCalcular.textContent =
                "Calcular Planejamento";
        }
    }
}

/* =====================================================
   MOSTRAR PLANEJAMENTO
===================================================== */

function mostrarPlanejamento(
    planejamento
) {
    document.getElementById(
        "meta"
    ).value =
        planejamento.meta;

    document.getElementById(
        "margem"
    ).value =
        planejamento.margem;

    document.getElementById(
        "data-inicio"
    ).value =
        planejamento.dataInicio;

    document.getElementById(
        "data-fim"
    ).value =
        planejamento.dataFim;

    document.getElementById(
        "dias-uteis"
    ).textContent =
        planejamento.diasUteis;

    document.getElementById(
        "dias-restantes"
    ).textContent =
        planejamento.diasRestantes;

    document.getElementById(
        "resultado-meta"
    ).textContent =
        moeda(
            planejamento.meta
        );

    document.getElementById(
        "resultado-realizado"
    ).textContent =
        moeda(
            planejamento.realizado
        );

    document.getElementById(
        "resultado-resta"
    ).textContent =
        moeda(
            planejamento.resta
        );

    document.getElementById(
        "resultado-diaria"
    ).textContent =
        moeda(
            planejamento.metaDiaria
        );

    document.getElementById(
        "resultado-estoque"
    ).textContent =
        moeda(
            planejamento.estoqueNecessario
        );

    document.getElementById(
        "resultado-lucro"
    ).textContent =
        moeda(
            planejamento.lucroPrevisto
        );
}

/* =====================================================
   CARREGAR PLANEJAMENTO SALVO
===================================================== */

async function carregarPlanejamentoSalvo() {
    const dadosSalvos =
        localStorage.getItem(
            "planejamentoAtual"
        );

    if (!dadosSalvos) {
        return;
    }

    try {
        const planejamento =
            JSON.parse(
                dadosSalvos
            );

        /*
         * Mostra imediatamente o último
         * planejamento salvo.
         */
        mostrarPlanejamento(
            planejamento
        );

        /*
         * Depois consulta o banco novamente.
         *
         * Dessa forma, novas vendas aparecem
         * automaticamente ao abrir a tela.
         */
        await calcularPlanejamento(
            false
        );

    } catch (erro) {
        console.error(
            "Erro ao carregar planejamento salvo:",
            erro
        );

        localStorage.removeItem(
            "planejamentoAtual"
        );
    }
}

/* =====================================================
   RESETAR PLANEJAMENTO
===================================================== */

function resetarPlanejamento() {
    const confirmar =
        confirm(
            "Deseja realmente apagar o planejamento atual?"
        );

    if (!confirmar) {
        return;
    }

    localStorage.removeItem(
        "planejamentoAtual"
    );

    document.getElementById(
        "meta"
    ).value = "";

    document.getElementById(
        "margem"
    ).value = "";

    document.getElementById(
        "data-inicio"
    ).value = "";

    document.getElementById(
        "data-fim"
    ).value = "";

    document.getElementById(
        "dias-uteis"
    ).textContent =
        "0";

    document.getElementById(
        "dias-restantes"
    ).textContent =
        "0";

    document.getElementById(
        "resultado-meta"
    ).textContent =
        "R$ 0,00";

    document.getElementById(
        "resultado-realizado"
    ).textContent =
        "R$ 0,00";

    document.getElementById(
        "resultado-resta"
    ).textContent =
        "R$ 0,00";

    document.getElementById(
        "resultado-diaria"
    ).textContent =
        "R$ 0,00";

    document.getElementById(
        "resultado-estoque"
    ).textContent =
        "R$ 0,00";

    document.getElementById(
        "resultado-lucro"
    ).textContent =
        "R$ 0,00";
}

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    carregarPlanejamentoSalvo
);