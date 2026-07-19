const express = require("express");

const clientesController = require(
    "../controllers/clientesController"
);

const {
    autenticar,
    permitirPerfis
} = require(
    "../middleware/autenticacao"
);

const router = express.Router();

/* =====================================================
   PROTEÇÃO GERAL DAS ROTAS DE CLIENTES

   Todas as rotas abaixo exigem um token JWT válido.
===================================================== */

router.use(autenticar);

/* =====================================================
   LISTAR CLIENTES

   Administrador:
   pode visualizar todos os clientes.

   Vendedor:
   pode consultar clientes para realizar vendas.

   Financeiro:
   pode consultar clientes para recebimentos e cobranças.
===================================================== */

router.get(
    "/",
    permitirPerfis(
        "admin",
        "vendedor",
        "financeiro"
    ),
    clientesController.listarClientes
);

/* =====================================================
   CADASTRAR CLIENTE

   Administrador e vendedor podem cadastrar clientes.
===================================================== */

router.post(
    "/",
    permitirPerfis(
        "admin",
        "vendedor"
    ),
    clientesController.cadastrarCliente
);

/* =====================================================
   HISTÓRICO DO CLIENTE

   Esta rota deve permanecer antes de /:id.

   Administrador:
   consulta todo o histórico.

   Vendedor:
   consulta o histórico para atendimento e novas vendas.

   Financeiro:
   consulta parcelas, recebimentos e pendências.
===================================================== */

router.get(
    "/historico/:nome",
    permitirPerfis(
        "admin",
        "vendedor",
        "financeiro"
    ),
    clientesController.historicoCliente
);

/* =====================================================
   BUSCAR CLIENTE PELO ID
===================================================== */

router.get(
    "/:id",
    permitirPerfis(
        "admin",
        "vendedor",
        "financeiro"
    ),
    clientesController.buscarClientePorId
);

/* =====================================================
   ATUALIZAR CLIENTE

   Administrador e vendedor podem atualizar cadastros.
===================================================== */

router.put(
    "/:id",
    permitirPerfis(
        "admin",
        "vendedor"
    ),
    clientesController.atualizarCliente
);

/* =====================================================
   EXCLUIR CLIENTE

   Somente o administrador pode excluir clientes.
===================================================== */

router.delete(
    "/:id",
    permitirPerfis("admin"),
    clientesController.excluirCliente
);

module.exports = router;