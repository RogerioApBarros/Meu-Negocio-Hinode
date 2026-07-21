window.onload = function () {
    adicionarEventosCalculo();
};

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function adicionarEventosCalculo() {
    document
        .getElementById("custo")
        .addEventListener("input", atualizarMargens);

    document
        .getElementById("valor-venda")
        .addEventListener("input", atualizarMargens);

    document
        .getElementById("impostos")
        .addEventListener("input", atualizarMargens);
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

    let margemBruta = (lucroBruto / valorVenda) * 100;
    let margemLiquida = (lucroLiquido / valorVenda) * 100;

    return {
        margemBruta,
        margemLiquida
    };
}

function atualizarMargens() {
    let custo = Number(document.getElementById("custo").value);
    let valorVenda = Number(document.getElementById("valor-venda").value);
    let impostos = Number(document.getElementById("impostos").value);

    let margens = calcularMargens(custo, valorVenda, impostos);

    document.getElementById("margem-bruta").innerHTML =
        margens.margemBruta.toFixed(2) + "%";

    document.getElementById("margem-liquida").innerHTML =
        margens.margemLiquida.toFixed(2) + "%";
}

function pegarDadosProduto() {
    let custo = Number(document.getElementById("custo").value);
    let valorVenda = Number(document.getElementById("valor-venda").value);
    let impostos = Number(document.getElementById("impostos").value);
    let quantidade = Number(document.getElementById("quantidade").value);

    let margens = calcularMargens(custo, valorVenda, impostos);

    return {
        nomeProduto: document.getElementById("nome-produto").value.trim(),
        marca: document.getElementById("marca").value.trim(),
        custo,
        valorVenda,
        impostos,
        margemLucroBruto: margens.margemBruta,
        margemLucroLiquido: margens.margemLiquida,
        quantidade
    };
}

function validarProduto(produto) {
    if (
        produto.nomeProduto === "" ||
        produto.marca === "" ||
        produto.custo < 0 ||
        produto.valorVenda <= 0 ||
        produto.impostos < 0 ||
        produto.quantidade < 0
    ) {
        alert("Preencha todos os campos obrigatórios corretamente.");
        return false;
    }

    return true;
}

async function cadastrarProduto() {
    const produto = pegarDadosProduto();

    if (!validarProduto(produto)) {
        return;
    }

    try {
        const dados = await window.API.requisicao(
            "/produtos",
            {
                method: "POST",
                body: produto
            }
        );

        alert(
            dados.mensagem ||
            "Produto cadastrado com sucesso!"
        );

        limparCampos();

    } catch (erro) {
        console.error(
            "Erro ao cadastrar produto:",
            erro
        );

        alert(
            erro.message ||
            "Erro ao cadastrar produto."
        );
    }

}

function limparCampos() {
    document.getElementById("nome-produto").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("custo").value = "";
    document.getElementById("valor-venda").value = "";
    document.getElementById("impostos").value = "";
    document.getElementById("quantidade").value = "";

    document.getElementById("margem-bruta").innerHTML = "0%";
    document.getElementById("margem-liquida").innerHTML = "0%";

    document.getElementById("nome-produto").focus();
}