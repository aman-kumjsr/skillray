const express = require("express");
const { saveAnswer } = require("../controllers/saveAnswer.controller");

const router = express.Router();

router.post("/save", saveAnswer);

module.exports = router;
