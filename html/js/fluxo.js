window.onload = function () {
    carregarFluxo();
};

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function carregarFluxo() {

    try {

        let resposta = await fetch("http://localhost:3000/fluxo");

        let dados = await resposta.json();

        console.log("Dados recebidos:");
        console.log(dados);

        document.getElementById("total-vendido").innerHTML =
            moeda(dados.totalVendido);

        document.getElementById("total-recebido").innerHTML =
            moeda(dados.totalRecebido);

        document.getElementById("total-aberto").innerHTML =
            moeda(dados.totalAberto);

        document.getElementById("total-vencido").innerHTML =
            moeda(dados.totalVencido);

        document.getElementById("estoque-custo").innerHTML =
            moeda(dados.estoqueCusto);

        document.getElementById("estoque-venda").innerHTML =
            moeda(dados.estoqueVenda);

        document.getElementById("lucro-previsto").innerHTML =
            moeda(dados.lucroBrutoPrevisto);

    }
    catch (erro) {

        console.log("Erro ao carregar fluxo:");
        console.log(erro);

        alert("Erro ao carregar fluxo financeiro.");

    }

}