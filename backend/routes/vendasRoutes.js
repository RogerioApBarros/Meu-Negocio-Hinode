const express = require("express");
const router = express.Router();

const vendasController = require(
    "../controllers/vendasController"
);

/*
 * Retorna o total vendido entre duas datas.
 *
 * Exemplo:
 * /vendas/resumo-periodo?inicio=2026-07-01&fim=2026-07-31
 */
router.get(
    "/resumo-periodo",
    vendasController.resumoVendasPeriodo
);

/*
 * Lista todas as vendas.
 */
router.get(
    "/",
    vendasController.listarVendas
);

/*
 * Registra uma nova venda.
 */
router.post(
    "/",
    vendasController.cadastrarVenda
);

module.exports = router;