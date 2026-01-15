const express = require("express");
const { submitAnswers } = require("../controllers/answer.controller");

const router = express.Router();

router.post("/submit", submitAnswers);

module.exports = router;
