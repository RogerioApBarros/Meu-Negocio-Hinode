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
        let resposta = await fetch("http://localhost:3000/produtos");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar produtos.");
        }

        produtosCadastrados = await resposta.json();

        produtosCadastrados.sort(function (a, b) {
            return a.nomeProduto.localeCompare(b.nomeProduto, "pt-BR");
        });

        atualizarResumo(produtosCadastrados);
        mostrarProdutos(produtosCadastrados);

    } catch (erro) {
        console.log("Erro ao carregar produtos:", erro);

        document.getElementById("lista-produtos").innerHTML = `
            <div class="mensagem">
                Não foi possível carregar os produtos.
            </div>
        `;
    }
}

function atualizarResumo(produtos) {
    let totalUnidades = 0;
    let estoqueCusto = 0;
    let estoqueVenda = 0;

    produtos.forEach(function (produto) {
        let quantidade = Number(produto.quantidade);
        let custo = Number(produto.custo);
        let valorVenda = Number(produto.valorVenda);

        totalUnidades += quantidade;
        estoqueCusto += custo * quantidade;
        estoqueVenda += valorVenda * quantidade;
    });

    document.getElementById("total-produtos").innerHTML =
        produtos.length;

    document.getElementById("total-unidades").innerHTML =
        totalUnidades;

    document.getElementById("estoque-custo").innerHTML =
        moeda(estoqueCusto);

    document.getElementById("estoque-venda").innerHTML =
        moeda(estoqueVenda);
}

function filtrarProdutos() {
    let busca = document
        .getElementById("pesquisa-produto")
        .value
        .toLowerCase()
        .trim();

    if (busca === "") {
        mostrarProdutos(produtosCadastrados);
        return;
    }

    let filtrados = produtosCadastrados.filter(function (produto) {
        return (
            (produto.nomeProduto || "")
                .toLowerCase()
                .includes(busca) ||

            (produto.marca || "")
                .toLowerCase()
                .includes(busca)
        );
    });

    mostrarProdutos(filtrados);
}

function mostrarProdutos(produtos) {
    let lista = document.getElementById("lista-produtos");

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
                        ${moeda(produto.impostos)}
                    </p>

                    <p>
                        <strong>Quantidade:</strong>
                        ${produto.quantidade}
                    </p>

                    <p>
                        <strong>Margem bruta:</strong>
                        ${Number(produto.margemLucroBruto).toFixed(2)}%
                    </p>

                    <p>
                        <strong>Margem líquida:</strong>
                        ${Number(produto.margemLucroLiquido).toFixed(2)}%
                    </p>

                </div>

                <div class="acoes-produto">

                    <button onclick="abrirModalEdicao(${produto.id})">
                        Editar
                    </button>

                    <button
                        onclick="excluirProduto(${produto.id}, '${escaparTexto(produto.nomeProduto)}')"
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
        .replaceAll("'", "\\'");
}

function abrirModalEdicao(id) {
    let produto = produtosCadastrados.find(function (item) {
        return item.id === id;
    });

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    document.getElementById("produto-id").value = produto.id;
    document.getElementById("editar-nome-produto").value = produto.nomeProduto;
    document.getElementById("editar-marca").value = produto.marca;
    document.getElementById("editar-custo").value = produto.custo;
    document.getElementById("editar-valor-venda").value = produto.valorVenda;
    document.getElementById("editar-impostos").value = produto.impostos;
    document.getElementById("editar-quantidade").value = produto.quantidade;

    atualizarMargensEdicao();

    document.getElementById("modal-edicao").style.display = "flex";
}

function fecharModalEdicao() {
    document.getElementById("modal-edicao").style.display = "none";
}

function adicionarEventosMargemEdicao() {
    document
        .getElementById("editar-custo")
        .addEventListener("input", atualizarMargensEdicao);

    document
        .getElementById("editar-valor-venda")
        .addEventListener("input", atualizarMargensEdicao);

    document
        .getElementById("editar-impostos")
        .addEventListener("input", atualizarMargensEdicao);
}

function calcularMargens(custo, valorVenda, impostos) {
    if (valorVenda <= 0) {
        return {
            margemBruta: 0,
            margemLiquida: 0
        };
    }

    let lucroBruto = valorVenda - custo;
    let lucroLiquido = valorVenda - custo - impostos;

    return {
        margemBruta: (lucroBruto / valorVenda) * 100,
        margemLiquida: (lucroLiquido / valorVenda) * 100
    };
}

function atualizarMargensEdicao() {
    let custo = Number(
        document.getElementById("editar-custo").value
    );

    let valorVenda = Number(
        document.getElementById("editar-valor-venda").value
    );

    let impostos = Number(
        document.getElementById("editar-impostos").value
    );

    let margens = calcularMargens(custo, valorVenda, impostos);

    document.getElementById("editar-margem-bruta").innerHTML =
        margens.margemBruta.toFixed(2) + "%";

    document.getElementById("editar-margem-liquida").innerHTML =
        margens.margemLiquida.toFixed(2) + "%";
}

async function salvarAlteracoes() {
    let id = document.getElementById("produto-id").value;

    let custo = Number(
        document.getElementById("editar-custo").value
    );

    let valorVenda = Number(
        document.getElementById("editar-valor-venda").value
    );

    let impostos = Number(
        document.getElementById("editar-impostos").value
    );

    let quantidade = Number(
        document.getElementById("editar-quantidade").value
    );

    let nomeProduto = document
        .getElementById("editar-nome-produto")
        .value
        .trim();

    let marca = document
        .getElementById("editar-marca")
        .value
        .trim();

    if (
        nomeProduto === "" ||
        marca === "" ||
        custo < 0 ||
        valorVenda <= 0 ||
        impostos < 0 ||
        quantidade < 0
    ) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    let margens = calcularMargens(custo, valorVenda, impostos);

    let produto = {
        nomeProduto,
        marca,
        custo,
        valorVenda,
        impostos,
        margemLucroBruto: margens.margemBruta,
        margemLucroLiquido: margens.margemLiquida,
        quantidade
    };

    try {
        let resposta = await fetch(
            "http://localhost:3000/produtos/" + id,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produto)
            }
        );

        let dados = await resposta.json();

        if (resposta.ok) {
            alert("Produto alterado com sucesso!");
            fecharModalEdicao();
            carregarProdutos();
        } else {
            alert(dados.erro || "Erro ao alterar produto.");
        }

    } catch (erro) {
        console.log("Erro ao alterar produto:", erro);
        alert("Erro de conexão com o servidor.");
    }
}

async function excluirProduto(id, nomeProduto) {
    let confirmou = confirm(
        `Tem certeza que deseja excluir o produto "${nomeProduto}"?`
    );

    if (!confirmou) {
        return;
    }

    try {
        let resposta = await fetch(
            "http://localhost:3000/produtos/" + id,
            {
                method: "DELETE"
            }
        );

        let dados = await resposta.json();

        if (resposta.ok) {
            alert("Produto excluído com sucesso!");
            carregarProdutos();
        } else {
            alert(dados.erro || "Erro ao excluir produto.");
        }

    } catch (erro) {
        console.log("Erro ao excluir produto:", erro);
        alert("Erro de conexão com o servidor.");
    }
}