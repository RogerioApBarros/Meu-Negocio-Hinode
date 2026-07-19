const express = require("express");

const router = express.Router();

const relatoriosController = require(
    "../controllers/relatoriosController"
);

/* =====================================================
   PRODUTOS E CLIENTES
===================================================== */

router.get(
    "/produtos-mais-vendidos",
    relatoriosController.produtosMaisVendidos
);

router.get(
    "/clientes-mais-compram",
    relatoriosController.clientesMaisCompram
);

/* =====================================================
   CONTAS A RECEBER
===================================================== */

router.get(
    "/parcelas-atraso",
    relatoriosController.parcelasEmAtraso
);

router.get(
    "/parcelas-periodo",
    relatoriosController.parcelasPorPeriodo
);

router.get(
    "/parcelas-cliente",
    relatoriosController.parcelasPorCliente
);

router.get(
    "/historico-cliente",
    relatoriosController.historicoFinanceiroCliente
);

router.get(
    "/resumo-financeiro",
    relatoriosController.resumoFinanceiro
);

/* =====================================================
   VENDAS
===================================================== */

router.get(
    "/vendas-periodo",
    relatoriosController.vendasPorPeriodo
);

router.get(
    "/vendas-cliente-periodo",
    relatoriosController.vendasClientePorPeriodo
);

/* =====================================================
   RECEBIMENTOS
===================================================== */

router.get(
    "/recebimentos-periodo",
    relatoriosController.recebimentosPorPeriodo
);

/* =====================================================
   EXPORTAÇÃO
===================================================== */

module.exports = router;