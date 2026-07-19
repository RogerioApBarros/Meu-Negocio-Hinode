const express = require("express");

const usuariosController =
    require("../controllers/usuariosController");

const {
    autenticar,
    permitirPerfis
} = require("../middleware/autenticacao");

const router = express.Router();

/*
 * Cadastro:
 * O primeiro usuário poderá ser criado sem token
 * e será automaticamente administrador.
 *
 * Por enquanto, esta rota continuará pública
 * para criarmos o primeiro acesso.
 */
router.post(
    "/cadastrar",
    usuariosController.cadastrar
);

router.post(
    "/login",
    usuariosController.login
);

router.get(
    "/perfil",
    autenticar,
    usuariosController.perfil
);

router.get(
    "/",
    autenticar,
    permitirPerfis("admin"),
    usuariosController.listar
);

router.patch(
    "/:id/status",
    autenticar,
    permitirPerfis("admin"),
    usuariosController.alterarStatus
);

module.exports = router;