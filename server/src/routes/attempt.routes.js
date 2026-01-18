const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getAttemptViolations } = require("../controllers/attempt.controller");

const router = express.Router();

// Admin-only (assumes authMiddleware sets req.user.role)
router.get(
  "/:attemptId/violations",
  authMiddleware,
  getAttemptViolations
);

module.exports = router;
