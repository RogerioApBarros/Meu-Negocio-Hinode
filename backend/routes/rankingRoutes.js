const express = require("express");
const router = express.Router();

const rankingController = require("../controllers/rankingController");

router.get("/produtos", rankingController.produtosMaisVendidos);

module.exports = router;