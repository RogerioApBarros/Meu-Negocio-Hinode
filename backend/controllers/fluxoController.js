const Venda = require("../models/vendasModel");
const Recebimento = require("../models/recebimentosModel");
const Produto = require("../models/produtosModel");

async function resumoFluxo(req, res) {
    try {
        const vendas = await Venda.findAll();
        const recebimentos = await Recebimento.findAll();
        const produtos = await Produto.findAll();

        let totalVendido = 0;
        let totalRecebido = 0;
        let totalAberto = 0;
        let totalVencido = 0;
        let estoqueCusto = 0;
        let estoqueVenda = 0;

        let hoje = new Date().toISOString().split("T")[0];

        vendas.forEach(venda => {
            totalVendido += Number(venda.totalFinal);
        });

        recebimentos.forEach(parcela => {
            if (parcela.status === "Recebida") {
                totalRecebido += Number(parcela.valorRecebido);
            }

            if (parcela.status === "Aberta") {
                totalAberto += Number(parcela.valorParcela);

                if (parcela.vencimento < hoje) {
                    totalVencido += Number(parcela.valorParcela);
                }
            }
        });

        produtos.forEach(produto => {
            estoqueCusto += Number(produto.custo) * Number(produto.quantidade);
            estoqueVenda += Number(produto.valorVenda) * Number(produto.quantidade);
        });

        let lucroBrutoPrevisto = totalVendido - estoqueCusto;

        res.json({
            totalVendido,
            totalRecebido,
            totalAberto,
            totalVencido,
            estoqueCusto,
            estoqueVenda,
            lucroBrutoPrevisto
        });

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { resumoFluxo };