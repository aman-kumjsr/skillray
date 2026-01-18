const express = require("express");
const { logViolation } = require("../controllers/violation.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/log", authMiddleware, logViolation);

module.exports = router;
