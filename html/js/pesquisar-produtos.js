let produtosCadastrados = [];

window.onload = function () {
    carregarProdutos();
    adicionarEventosMargemEdicao();
};

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function carregarProdutos() {
    try {
        produtosCadastrados = await window.API.requisicao(
            "/produtos"
        );

        produtosCadastrados.sort(function (a, b) {
            return a.nomeProduto.localeCompare(
                b.nomeProduto,
                "pt-BR"
            );
        });

        atualizarResumo(produtosCadastrados);
        mostrarProdutos(produtosCadastrados);

    } catch (erro) {
        console.error(
            "Erro ao carregar produtos:",
            erro
        );

        document.getElementById(
            "lista-produtos"
        ).innerHTML = `
            <div class="mensagem">
                ${
                    erro.message ||
                    "Não foi possível carregar os produtos."
                }
            </div>
        `;
    }
}

function atualizarResumo(produtos) {
    let totalUnidades = 0;
    let estoqueCusto = 0;
    let estoqueVenda = 0;

    produtos.forEach(function (produto) {
        const quantidade = Number(
            produto.quantidade
        );

        const custo = Number(
            produto.custo
        );

        const valorVenda = Number(
            produto.valorVenda
        );

        totalUnidades += quantidade;
        estoqueCusto += custo * quantidade;
        estoqueVenda += valorVenda * quantidade;
    });

    document.getElementById(
        "total-produtos"
    ).innerHTML = produtos.length;

    document.getElementById(
        "total-unidades"
    ).innerHTML = totalUnidades;

    document.getElementById(
        "estoque-custo"
    ).innerHTML = moeda(estoqueCusto);

    document.getElementById(
        "estoque-venda"
    ).innerHTML = moeda(estoqueVenda);
}

function filtrarProdutos() {
    const busca = document
        .getElementById("pesquisa-produto")
        .value
        .toLowerCase()
        .trim();

    if (busca === "") {
        mostrarProdutos(produtosCadastrados);
        return;
    }

    const filtrados = produtosCadastrados.filter(
        function (produto) {
            return (
                (produto.nomeProduto || "")
                    .toLowerCase()
                    .includes(busca) ||

                (produto.marca || "")
                    .toLowerCase()
                    .includes(busca)
            );
        }
    );

    mostrarProdutos(filtrados);
}

function mostrarProdutos(produtos) {
    const lista = document.getElementById(
        "lista-produtos"
    );

    lista.innerHTML = "";

    if (produtos.length === 0) {
        lista.innerHTML = `
            <div class="mensagem">
                Nenhum produto encontrado.
            </div>
        `;
        return;
    }

    produtos.forEach(function (produto) {
        lista.innerHTML += `
            <article class="produto-card">

                <div class="produto-cabecalho">

                    <div>
                        <h3>${produto.nomeProduto}</h3>
                        <span>${produto.marca}</span>
                    </div>

                    <span class="codigo-produto">
                        #${produto.id}
                    </span>

                </div>

                <div class="produto-dados">

                    <p>
                        <strong>Custo:</strong>
                        ${moeda(produto.custo)}
                    </p>

                    <p>
                        <strong>Venda:</strong>
                        ${moeda(produto.valorVenda)}
                    </p>

                    <p>
                        <strong>Impostos:</strong>
                        ${moeda(produto.impostos