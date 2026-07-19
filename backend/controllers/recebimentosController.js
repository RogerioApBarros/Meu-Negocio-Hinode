const { Op } = require("sequelize");
const Recebimento = require("../models/recebimentosModel");

async function listarRecebimentos(req, res) {
    try {
        const recebimentos = await Recebimento.findAll({
            order: [["vencimento", "ASC"]]
        });

        res.json(recebimentos);

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function buscarRecebimentosPorCliente(req, res) {
    try {
        const cliente = req.params.cliente;

        const recebimentos = await Recebimento.findAll({
            where: {
                cliente: cliente,
                status: {
                    [Op.ne]: "Recebida"
                }
            },
            order: [["vencimento", "ASC"]]
        });

        res.json(recebimentos);

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function baixarRecebimento(req, res) {
    try {
        const { id } = req.params;
        const { valorRecebido, observacao, vencimentoRestante } = req.body;

        const recebimento = await Recebimento.findByPk(id);

        if (!recebimento) {
            return res.status(404).json({
                erro: "Recebimento não encontrado."
            });
        }

        let valorParcela = Number(recebimento.valorParcela);
        let valorJaRecebido = Number(recebimento.valorRecebido);
        let valorRecebidoAgora = Number(valorRecebido);

        let saldo = valorParcela - valorJaRecebido;

        if (valorRecebidoAgora <= 0) {
            return res.status(400).json({
                erro: "Valor recebido inválido."
            });
        }

        if (valorRecebidoAgora > saldo) {
            return res.status(400).json({
                erro: "Valor recebido maior que o saldo da parcela."
            });
        }

        // RECEBIMENTO TOTAL
        if (valorRecebidoAgora === saldo) {
            recebimento.valorRecebido = valorParcela;
            recebimento.status = "Recebida";
            recebimento.dataRecebimento = new Date().toISOString().split("T")[0];
            recebimento.observacao = observacao || null;

            await recebimento.save();

            return res.json({
                mensagem: "Parcela recebida totalmente.",
                recebimento
            });
        }

        // RECEBIMENTO PARCIAL COM GERAÇÃO DE NOVA PARCELA
        if (valorRecebidoAgora < saldo) {
            if (!vencimentoRestante) {
                return res.status(400).json({
                    erro: "Informe o vencimento do restante."
                });
            }

            let valorRestante = saldo - valorRecebidoAgora;

            recebimento.valorParcela = valorJaRecebido + valorRecebidoAgora;
            recebimento.valorRecebido = valorJaRecebido + valorRecebidoAgora;
            recebimento.status = "Recebida";
            recebimento.dataRecebimento = new Date().toISOString().split("T")[0];
            recebimento.observacao = observacao || "Recebimento parcial";

            await recebimento.save();

            const ultimaParcela = await Recebimento.max("numeroParcela", {
                where: {
                    VendaId: recebimento.VendaId
                }
            });

            await Recebimento.create({
                cliente: recebimento.cliente,
                numeroParcela: Number(ultimaParcela) + 1,
                valorParcela: valorRestante,
                valorRecebido: 0,
                vencimento: vencimentoRestante,
                dataRecebimento: null,
                status: "Aberta",
                observacao: "Restante da parcela " + recebimento.numeroParcela,
                VendaId: recebimento.VendaId
            });

            return res.json({
                mensagem: "Recebimento parcial registrado e nova parcela gerada.",
                valorRecebido: valorRecebidoAgora,
                valorRestante
            });
        }

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = {
    listarRecebimentos,
    buscarRecebimentosPorCliente,
    baixarRecebimento
};