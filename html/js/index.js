window.onload = function () {
    carregarDashboard();
    carregarRankingProdutos();
};

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function carregarDashboard() {
    try {
        let resposta = await fetch("http://localhost:3000/fluxo");
        let dados = await resposta.json();

        document.getElementById("dash-vendido").innerHTML = moeda(dados.totalVendido);
        document.getElementById("dash-recebido").innerHTML = moeda(dados.totalRecebido);
        document.getElementById("dash-aberto").innerHTML = moeda(dados.totalAberto);
        document.getElementById("dash-vencido").innerHTML = moeda(dados.totalVencido);
        document.getElementById("dash-estoque-custo").innerHTML = moeda(dados.estoqueCusto);
        document.getElementById("dash-estoque-venda").innerHTML = moeda(dados.estoqueVenda);
        document.getElementById("dash-lucro").innerHTML = moeda(dados.lucroBrutoPrevisto);

    } catch (erro) {
        console.log("Erro ao carregar dashboard:", erro);
    }
}

async function carregarRankingProdutos() {
    try {
        let resposta = await fetch("http://localhost:3000/ranking/produtos");
        let ranking = await resposta.json();

        let area = document.getElementById("ranking-produtos");
        area.innerHTML = "";

        for (let i = 0; i < ranking.length; i++) {
            area.innerHTML += `
                <div class="ranking-item">
                    <strong>${i + 1}º ${ranking[i].produto}</strong>
                    <span>${ranking[i].quantidade} unidades</span>
                </div>
            `;
        }

    } catch (erro) {
        console.log("Erro ao carregar ranking:", erro);
    }
}