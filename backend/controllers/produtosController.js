const Produto = require("../models/produtosModel");

async function cadastrarProduto(req, res) {
    try {
        const produto = await Produto.create(req.body);

        res.status(201).json(produto);

    } catch (erro) {
        res.status(500).json({
            erro: erro.message
        });
    }
}

async function listarProdutos(req, res) {
    try {
        const produtos = await Produto.findAll({
            order: [["nomeProduto", "ASC"]]
        });

        res.json(produtos);

    } catch (erro) {
        res.status(500).json({
            erro: erro.message
        });
    }
}

async function atualizarProduto(req, res) {
    try {
        const { id } = req.params;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        await produto.update(req.body);

        res.json({
            mensagem: "Produto alterado com sucesso.",
            produto
        });

    } catch (erro) {
        res.status(500).json({
            erro: erro.message
        });
    }
}

async function excluirProduto(req, res) {
    try {
        const { id } = req.params;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        await produto.destroy();

        res.json({
            mensagem: "Produto excluído com sucesso."
        });

    } catch (erro) {
        res.status(500).json({
            erro: erro.message
        });
    }
}

module.exports = {
    cadastrarProduto,
    listarProdutos,
    atualizarProduto,
    excluirProduto
};