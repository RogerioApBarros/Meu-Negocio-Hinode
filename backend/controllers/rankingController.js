const ItemVenda = require("../models/itensVendaModel");

async function produtosMaisVendidos(req, res) {
    try {
        const itens = await ItemVenda.findAll();

        let ranking = {};

        itens.forEach(function (item) {
            if (!ranking[item.produto]) {
                ranking[item.produto] = 0;
            }

            ranking[item.produto] += Number(item.quantidade);
        });

        let resultado = Object.keys(ranking).map(function (produto) {
            return {
                produto: produto,
                quantidade: ranking[produto]
            };
        });

        resultado.sort(function (a, b) {
            return b.quantidade - a.quantidade;
        });

        res.json(resultado);

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = {
    produtosMaisVendidos
};