const express = require("express");

const empresasController =
    require("../controllers/empresasController");

const {
    autenticar,
    permitirPerfis
} = require("../middleware/autenticacao");

const router = express.Router();

router.post(
    "/",
    autenticar,
    permitirPerfis("admin"),
    empresasController.cadastrar
);

router.get(
    "/",
    autenticar,
    permitirPerfis("admin"),
    empresasController.listar
);

router.get(
    "/:id",
    autenticar,
    permitirPerfis("admin"),
    empresasController.buscarPorId
);

router.put(
    "/:id",
    autenticar,
    permitirPerfis("admin"),
    empresasController.atualizar
);

router.patch(
    "/:id/status",
    autenticar,
    permitirPerfis("admin"),
    empresasController.alterarStatus
);

module.exports = router;
