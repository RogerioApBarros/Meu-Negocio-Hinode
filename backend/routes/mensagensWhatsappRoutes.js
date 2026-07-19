const express = require(
    "express"
);

const router =
    express.Router();

const mensagensWhatsappController =
    require(
        "../controllers/mensagensWhatsappController"
    );

/* =====================================================
   LISTAR MENSAGENS
===================================================== */

router.get(
    "/",
    mensagensWhatsappController.listarMensagens
);

/* =====================================================
   LISTAR MENSAGENS ATIVAS
===================================================== */

router.get(
    "/ativas",
    mensagensWhatsappController.listarMensagensAtivas
);

/* =====================================================
   BUSCAR MENSAGEM POR ID
===================================================== */

router.get(
    "/:id",
    mensagensWhatsappController.buscarMensagemPorId
);

/* =====================================================
   CADASTRAR MENSAGEM
===================================================== */

router.post(
    "/",
    mensagensWhatsappController.cadastrarMensagem
);

/* =====================================================
   ATUALIZAR MENSAGEM
===================================================== */

router.put(
    "/:id",
    mensagensWhatsappController.atualizarMensagem
);

/* =====================================================
   ATIVAR OU DESATIVAR
===================================================== */

router.patch(
    "/:id/status",
    mensagensWhatsappController.alterarStatusMensagem
);

/* =====================================================
   EXCLUIR MENSAGEM
===================================================== */

router.delete(
    "/:id",
    mensagensWhatsappController.excluirMensagem
);

module.exports =
    router;