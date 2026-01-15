const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createQuestion,
  getAllQuestions,
} = require("../controllers/question.controller");

const router = express.Router();

router.post("/", authMiddleware, createQuestion);
router.get("/", authMiddleware, getAllQuestions);

module.exports = router;
