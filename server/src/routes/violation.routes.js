const express = require("express");
const { logViolation } = require("../controllers/violation.controller");

const router = express.Router();

router.post("/log", logViolation);

module.exports = router;
