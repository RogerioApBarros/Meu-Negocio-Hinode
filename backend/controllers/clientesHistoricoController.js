const Cliente = require("../models/clientes");
const Venda = require("../models/vendasModel");
const Recebimento = require("../models/recebimentosModel");

async function historicoCliente(req, res) {
    try {
        const nomeCliente = req.params.nome;

        const cliente = await Cliente.findOne({
            where: { nome: nomeCliente }
        });

        const vendas = await Venda.findAll({
            where: { cliente: nomeCliente }
        });

        const recebimentos = await Recebimento.findAll({
            where: { cliente: nomeCliente }
        });

        let totalComprado = 0;
        let totalRecebido = 0;
        let totalAberto = 0;

        vendas.forEach(function (venda) {
            totalComprado += Number(venda.totalFinal);
        });

        recebimentos.forEach(function (parcela) {
            if (parcela.status === "Recebida") {
                totalRecebido += Number(parcela.valorRecebido);
            }

            if (parcela.status === "Aberta") {
                totalAberto += Number(parcela.valorParcela);
            }
        });

        res.json({
            cliente: cliente,
            vendas: vendas,
            recebimentos: recebimentos,
            totalComprado: totalComprado,
            totalRecebido: totalRecebido,
            totalAberto: totalAberto,
            quantidadeCompras: vendas.length
        });

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = {
    historicoCliente
};