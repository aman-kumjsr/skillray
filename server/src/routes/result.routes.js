const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getTestResults } = require("../controllers/result.controller");

const router = express.Router();

router.get("/tests/:testId", authMiddleware, getTestResults);

module.exports = router;
