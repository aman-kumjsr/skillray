const express = require("express");
const { getPublicTest } = require("../controllers/publicTest.controller");

const router = express.Router();

router.get("/test/:token", getPublicTest);


module.exports = router;
