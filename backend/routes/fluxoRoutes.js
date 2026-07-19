const express = require("express");
const router = express.Router();

const fluxoController = require("../controllers/fluxoController");

router.get("/", fluxoController.resumoFluxo);

module.exports = router;