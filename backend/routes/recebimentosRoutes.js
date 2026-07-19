const express = require("express");
const router = express.Router();

const recebimentosController = require("../controllers/recebimentosController");

router.get("/", recebimentosController.listarRecebimentos);

router.get("/cliente/:cliente", recebimentosController.buscarRecebimentosPorCliente);

router.put("/:id", recebimentosController.baixarRecebimento);

module.exports = router;