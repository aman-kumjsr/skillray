const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createTest,
  getAllTests,
} = require("../controllers/test.controller");

const router = express.Router();

router.post("/", authMiddleware, createTest);
router.get("/", authMiddleware, getAllTests);

module.exports = router;
