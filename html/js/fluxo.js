document.addEventListener(
    "DOMContentLoaded",
    carregarFluxo
);

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

async function carregarFluxo() {
    try {
        if (
            !window.API ||
            typeof window.API.requisicao !== "function"
        ) {
            throw new Error(
                "O serviço da API não foi carregado."
            );
        }

        const dados =
            await window.API.requisicao(
                "/fluxo"
            );

        console.log(
            "Dados do fluxo recebidos:",
            dados
        );

        document.getElementById(
            "total-vendido"
        ).textContent =
            moeda(
                dados.totalVendido
            );

        document.getElementById(
            "total-recebido"
        ).textContent =
            moeda(
                dados.totalRecebido
            );

        document.getElementById(
            "total-aberto"
        ).textContent =
            moeda(
                dados.totalAberto
            );

        document.getElementById(
            "total-vencido"
        ).textContent =
            moeda(
                dados.totalVencido
            );

        document.getElementById(
            "estoque-custo"
        ).textContent =
            moeda(
                dados.estoqueCusto
            );

        document.getElementById(
            "estoque-venda"
        ).textContent =
            moeda(
                dados.estoqueVenda
            );

        document.getElementById(
            "lucro-previsto"
        ).textContent =
            moeda(
                dados.lucroBrutoPrevisto
            );

    } catch (erro) {
        console.error(
            "Erro ao carregar fluxo:",
            erro
        );

        alert(
            erro.message ||
            "Erro ao carregar fluxo financeiro."
        );
    }
}