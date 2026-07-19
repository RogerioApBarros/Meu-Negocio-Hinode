const express = require("express");
const router = express.Router();

const produtosController = require("../controllers/produtosController");

router.get("/", produtosController.listarProdutos);

router.post("/", produtosController.cadastrarProduto);

router.put("/:id", produtosController.atualizarProduto);

router.delete("/:id", produtosController.excluirProduto);

module.exports = router;