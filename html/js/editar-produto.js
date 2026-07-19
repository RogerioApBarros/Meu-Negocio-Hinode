let produtosCadastrados = [];

window.onload = function () {
    carregarProdutos();
};

async function carregarProdutos() {
    try {
        let resposta = await fetch("http://localhost:3000/produtos");
        produtosCadastrados = await resposta.json();
        mostrarTodosProdutos();

    } catch (erro) {
        console.log("Erro ao carregar produtos:", erro);
    }
}

function mostrarTodosProdutos() {
    let resultado = document.getElementById("resultado-busca-produtos");

    resultado.innerHTML = "";

    produtosCadastrados.forEach(function (produto) {
        resultado.innerHTML += `
            <div class="produto-busca" onclick="selecionarProduto(${produto.id})">
                <strong>${produto.nomeProduto}</strong><br>
                Marca: ${produto.marca} |
                Venda: R$ ${Number(produto.valorVenda).toFixed(2)} |
                Estoque: ${produto.quantidade}
            </div>
        `;
    });
}

function filtrarProdutos() {
    let busca = document.getElementById("buscar-produto").value.toLowerCase();
    let resultado = document.getElementById("resultado-busca-produtos");

    resultado.innerHTML = "";

    let encontrados = produtosCadastrados.filter(function (produto) {
        return produto.nomeProduto.toLowerCase().includes(busca);
    });

    if (encontrados.length === 0) {
        resultado.innerHTML = `
            <div class="produto-item">
                Produto não encontrado.
            </div>
        `;
        return;
    }

    encontrados.forEach(function (produto) {
        resultado.innerHTML += `
            <div class="produto-busca" onclick="selecionarProduto(${produto.id})">
                <strong>${produto.nomeProduto}</strong><br>
                Marca: ${produto.marca} |
                Venda: R$ ${Number(produto.valorVenda).toFixed(2)} |
                Estoque: ${produto.quantidade}
            </div>
        `;
    });
}

function selecionarProduto(id) {
    let produtoEncontrado = produtosCadastrados.find(function (produto) {
        return produto.id === id;
    });

    if (!produtoEncontrado) {
        alert("Produto não encontrado.");
        return;
    }

    document.getElementById("produto-id").value = produtoEncontrado.id;
    document.getElementById("nome-produto").value = produtoEncontrado.nomeProduto;
    document.getElementById("marca").value = produtoEncontrado.marca;
    document.getElementById("custo").value = produtoEncontrado.custo;
    document.getElementById("valor-venda").value = produtoEncontrado.valorVenda;
    document.getElementById("impostos").value = produtoEncontrado.impostos;
    document.getElementById("quantidade").value = produtoEncontrado.quantidade;

    document.getElementById("margem-bruta").innerHTML =
        Number(produtoEncontrado.margemLucroBruto).toFixed(2) + "%";

    document.getElementById("margem-liquida").innerHTML =
        Number(produtoEncontrado.margemLucroLiquido).toFixed(2) + "%";
}

function calcularMargens(custo, valorVenda, impostos) {
    let lucroBruto = valorVenda - custo;
    let lucroLiquido = valorVenda - custo - impostos;

    let margemBruta = (lucroBruto / valorVenda) * 100;
    let margemLiquida = (lucroLiquido / valorVenda) * 100;

    return {
        margemBruta,
        margemLiquida
    };
}

function pegarDadosProduto() {
    let custo = Number(document.getElementById("custo").value);
    let valorVenda = Number(document.getElementById("valor-venda").value);
    let impostos = Number(document.getElementById("impostos").value);
    let quantidade = Number(document.getElementById("quantidade").value);

    let margens = calcularMargens(custo, valorVenda, impostos);

    return {
        nomeProduto: document.getElementById("nome-produto").value,
        marca: document.getElementById("marca").value,
        custo: custo,
        valorVenda: valorVenda,
        impostos: impostos,
        margemLucroBruto: margens.margemBruta,
        margemLucroLiquido: margens.margemLiquida,
        quantidade: quantidade
    };
}

function validarProduto(produto) {
    if (
        produto.nomeProduto === "" ||
        produto.marca === "" ||
        produto.custo <= 0 ||
        produto.valorVenda <= 0 ||
        produto.impostos < 0 ||
        produto.quantidade < 0
    ) {
        alert("Preencha todos os campos obrigatórios corretamente.");
        return false;
    }

    return true;
}

async function salvarAlteracoes() {
    let id = document.getElementById("produto-id").value;

    if (id === "") {
        alert("Selecione um produto antes de salvar alterações.");
        return;
    }

    let produto = pegarDadosProduto();

    if (!validarProduto(produto)) {
        return;
    }

    try {
        let resposta = await fetch("http://localhost:3000/produtos/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(produto)
        });

        if (resposta.ok) {
            alert("Produto alterado com sucesso!");
            limparCampos();
            carregarProdutos();
        } else {
            alert("Erro ao alterar produto.");
        }

    } catch (erro) {
        alert("Erro de conexão com o servidor.");
        console.log(erro);
    }
}

function limparCampos() {
    document.getElementById("produto-id").value = "";
    document.getElementById("buscar-produto").value = "";
    document.getElementById("nome-produto").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("custo").value = "";
    document.getElementById("valor-venda").value = "";
    document.getElementById("impostos").value = "";
    document.getElementById("quantidade").value = "";

    document.getElementById("margem-bruta").innerHTML = "0%";
    document.getElementById("margem-liquida").innerHTML = "0%";
}