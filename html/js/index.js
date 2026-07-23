document.addEventListener(
    "DOMContentLoaded",
    inicializarDashboard
);

async function inicializarDashboard() {
    try {
        if (
            !window.API ||
            typeof window.API.requisicao !== "function"
        ) {
            throw new Error(
                "O serviço da API não foi carregado."
            );
        }

        await Promise.all([
            carregarDashboard(),
            carregarRankingProdutos()
        ]);

    } catch (erro) {
        console.error(
            "Erro ao inicializar o dashboard:",
            erro
        );
    }
}

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

async function carregarDashboard() {
    try {
        const dados =
            await window.API.requisicao(
                "/fluxo"
            );

        document.getElementById(
            "dash-vendido"
        ).textContent =
            moeda(dados.totalVendido);

        document.getElementById(
            "dash-recebido"
        ).textContent =
            moeda(dados.totalRecebido);

        document.getElementById(
            "dash-aberto"
        ).textContent =
            moeda(dados.totalAberto);

        document.getElementById(
            "dash-vencido"
        ).textContent =
            moeda(dados.totalVencido);

        document.getElementById(
            "dash-estoque-custo"
        ).textContent =
            moeda(dados.estoqueCusto);

        document.getElementById(
            "dash-estoque-venda"
        ).textContent =
            moeda(dados.estoqueVenda);

        document.getElementById(
            "dash-lucro"
        ).textContent =
            moeda(dados.lucroBrutoPrevisto);

    } catch (erro) {
        console.error(
            "Erro ao carregar dashboard:",
            erro
        );
    }
}

async function carregarRankingProdutos() {
    try {
        const dados =
            await window.API.requisicao(
                "/ranking/produtos"
            );

        const ranking =
            Array.isArray(dados)
                ? dados
                : (
                    dados &&
                    Array.isArray(dados.ranking)
                        ? dados.ranking
                        : (
                            dados &&
                            Array.isArray(dados.dados)
                                ? dados.dados
                                : []
                        )
                );

        const area =
            document.getElementById(
                "ranking-produtos"
            );

        if (!area) {
            return;
        }

        area.innerHTML = "";

        if (ranking.length === 0) {
            area.innerHTML = `
                <p>
                    Nenhum produto vendido ainda.
                </p>
            `;

            return;
        }

        ranking.forEach(
            function (
                item,
                indice
            ) {
                area.innerHTML += `
                    <div class="ranking-item">

                        <strong>
                            ${indice + 1}º
                            ${item.produto || ""}
                        </strong>

                        <span>
                            ${Number(
                                item.quantidade || 0
                            )}
                            unidades
                        </span>

                    </div>
                `;
            }
        );

    } catch (erro) {
        console.error(
            "Erro ao carregar ranking:",
            erro
        );

        const area =
            document.getElementById(
                "ranking-produtos"
            );

        if (area) {
            area.innerHTML = `
                <p>
                    Não foi possível carregar o ranking.
                </p>
            `;
        }
    }
}