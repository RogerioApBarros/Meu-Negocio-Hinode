let produtosCadastrados = [];

window.onload = function () {
    carregarProdutos();
    adicionarEventosMargemEdicao();
};

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function carregarProdutos() {
    try {
        produtosCadastrados = await window.API.requisicao(
            "/produtos"
        );

        if (!Array.isArray(produtosCadastrados)) {
            produtosCadastrados = [];
        }

        produtosCadastrados.sort(function (a, b) {
            return String(a.nomeProduto || "").localeCompare(
                String(b.nomeProduto || ""),
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

        produtosCadastrados = [];

        atualizarResumo(produtosCadastrados);

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
            produto.quantidade || 0
        );

        const custo = Number(
            produto.custo || 0
        );

        const valorVenda = Number(
            produto.valorVenda || 0
        );

        totalUnidades += quantidade;
        estoqueCusto += custo * quantidade;
        estoqueVenda += valorVenda * quantidade;
    });

    document.getElementById(
        "total-produtos"
    ).textContent = produtos.length;

    document.getElementById(
        "total-unidades"
    ).textContent = totalUnidades;

    document.getElementById(
        "estoque-custo"
    ).textContent = moeda(estoqueCusto);

    document.getElementById(
        "estoque-venda"
    ).textContent = moeda(estoqueVenda);
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
            const nome = String(
                produto.nomeProduto || ""
            ).toLowerCase();

            const marca = String(
                produto.marca || ""
            ).toLowerCase();

            return (
                nome.includes(busca) ||
                marca.includes(busca)
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
        const nomeProduto = escaparHTML(
            produto.nomeProduto || ""
        );

        const marca = escaparHTML(
            produto.marca || ""
        );

        const nomeParaAcao = escaparTexto(
            produto.nomeProduto || ""
        );

        lista.innerHTML += `
            <article class="produto-card">

                <div class="produto-cabecalho">

                    <div>
                        <h3>${nomeProduto}</h3>
                        <span>${marca}</span>
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
                        ${moeda(produto.impostos)}
                    </p>

                    <p>
                        <strong>Quantidade:</strong>
                        ${Number(produto.quantidade || 0)}
                    </p>

                    <p>
                        <strong>Margem bruta:</strong>
                        ${Number(
                            produto.margemLucroBruto || 0
                        ).toFixed(2)}%
                    </p>

                    <p>
                        <strong>Margem líquida:</strong>
                        ${Number(
                            produto.margemLucroLiquido || 0
                        ).toFixed(2)}%
                    </p>

                </div>

                <div class="acoes-produto">

                    <button
                        type="button"
                        onclick="abrirModalEdicao(${produto.id})"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        onclick="excluirProduto(${produto.id}, '${nomeParaAcao}')"
                        class="botao-excluir"
                    >
                        Excluir
                    </button>

                </div>

            </article>
        `;
    });
}

function escaparTexto(texto) {
    return String(texto)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'")
        .replaceAll("\n", " ")
        .replaceAll("\r", " ");
}

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function abrirModalEdicao(id) {
    const produto = produtosCadastrados.find(
        function (item) {
            return Number(item.id) === Number(id);
        }
    );

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    document.getElementById(
        "produto-id"
    ).value = produto.id;

    document.getElementById(
        "editar-nome-produto"
    ).value = produto.nomeProduto || "";

    document.getElementById(
        "editar-marca"
    ).value = produto.marca || "";

    document.getElementById(
        "editar-custo"
    ).value = produto.custo || 0;

    document.getElementById(
        "editar-valor-venda"
    ).value = produto.valorVenda || 0;

    document.getElementById(
        "editar-impostos"
    ).value = produto.impostos || 0;

    document.getElementById(
        "editar-quantidade"
    ).value = produto.quantidade || 0;

    atualizarMargensEdicao();

    document.getElementById(
        "modal-edicao"
    ).style.display = "flex";
}

function fecharModalEdicao() {
    document.getElementById(
        "modal-edicao"
    ).style.display = "none";
}

function adicionarEventosMargemEdicao() {
    const campoCusto = document.getElementById(
        "editar-custo"
    );

    const campoValorVenda = document.getElementById(
        "editar-valor-venda"
    );

    const campoImpostos = document.getElementById(
        "editar-impostos"
    );

    if (
        !campoCusto ||
        !campoValorVenda ||
        !campoImpostos
    ) {
        return;
    }

    campoCusto.addEventListener(
        "input",
        atualizarMargensEdicao
    );

    campoValorVenda.addEventListener(
        "input",
        atualizarMargensEdicao
    );

    campoImpostos.addEventListener(
        "input",
        atualizarMargensEdicao
    );
}

function calcularMargens(
    custo,
    valorVenda,
    impostos
) {
    if (valorVenda <= 0) {
        return {
            margemBruta: 0,
            margemLiquida: 0
        };
    }

    const lucroBruto =
        valorVenda - custo;

    const lucroLiquido =
        valorVenda - custo - impostos;

    return {
        margemBruta:
            (lucroBruto / valorVenda) * 100,

        margemLiquida:
            (lucroLiquido / valorVenda) * 100
    };
}

function atualizarMargensEdicao() {
    const custo = Number(
        document.getElementById(
            "editar-custo"
        ).value
    ) || 0;

    const valorVenda = Number(
        document.getElementById(
            "editar-valor-venda"
        ).value
    ) || 0;

    const impostos = Number(
        document.getElementById(
            "editar-impostos"
        ).value
    ) || 0;

    const margens = calcularMargens(
        custo,
        valorVenda,
        impostos
    );

    document.getElementById(
        "editar-margem-bruta"
    ).textContent =
        margens.margemBruta.toFixed(2) + "%";

    document.getElementById(
        "editar-margem-liquida"
    ).textContent =
        margens.margemLiquida.toFixed(2) + "%";
}

async function salvarAlteracoes() {
    const id = Number(
        document.getElementById(
            "produto-id"
        ).value
    );

    const nomeProduto = document
        .getElementById(
            "editar-nome-produto"
        )
        .value
        .trim();

    const marca = document
        .getElementById(
            "editar-marca"
        )
        .value
        .trim();

    const custo = Number(
        document.getElementById(
            "editar-custo"
        ).value
    );

    const valorVenda = Number(
        document.getElementById(
            "editar-valor-venda"
        ).value
    );

    const impostos = Number(
        document.getElementById(
            "editar-impostos"
        ).value
    );

    const quantidade = Number(
        document.getElementById(
            "editar-quantidade"
        ).value
    );

    if (
        !id ||
        nomeProduto === "" ||
        marca === "" ||
        Number.isNaN(custo) ||
        Number.isNaN(valorVenda) ||
        Number.isNaN(impostos) ||
        Number.isNaN(quantidade) ||
        custo < 0 ||
        valorVenda <= 0 ||
        impostos < 0 ||
        quantidade < 0
    ) {
        alert(
            "Preencha todos os campos corretamente."
        );

        return;
    }

    const margens = calcularMargens(
        custo,
        valorVenda,
        impostos
    );

    const produto = {
        nomeProduto,
        marca,
        custo,
        valorVenda,
        impostos,
        margemLucroBruto:
            margens.margemBruta,
        margemLucroLiquido:
            margens.margemLiquida,
        quantidade
    };

    try {
        const dados = await window.API.requisicao(
            "/produtos/" + id,
            {
                method: "PUT",
                body: produto
            }
        );

        alert(
            dados.mensagem ||
            "Produto alterado com sucesso!"
        );

        fecharModalEdicao();

        await carregarProdutos();

    } catch (erro) {
        console.error(
            "Erro ao alterar produto:",
            erro
        );

        alert(
            erro.message ||
            "Erro ao alterar produto."
        );
    }
}

async function excluirProduto(
    id,
    nomeProduto
) {
    const confirmou = confirm(
        `Tem certeza que deseja excluir o produto "${nomeProduto}"?`
    );

    if (!confirmou) {
        return;
    }

    try {
        const dados = await window.API.requisicao(
            "/produtos/" + id,
            {
                method: "DELETE"
            }
        );

        alert(
            dados.mensagem ||
            "Produto excluído com sucesso!"
        );

        await carregarProdutos();

    } catch (erro) {
        console.error(
            "Erro ao excluir produto:",
            erro
        );

        alert(
            erro.message ||
            "Erro ao excluir produto."
        );
    }
}