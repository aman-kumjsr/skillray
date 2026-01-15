const prisma = require("../lib/prisma");

const createQuestion = async (req, res) => {
  try {
    const {
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
    } = req.body;

    // Validation
    if (
      !text ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD ||
      !correctOption
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        createdBy: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Question created successfully",
      question,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create question",
    });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: {
        createdBy: req.user.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(questions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch questions",
    });
  }
};

module.exports = { createQuestion, getAllQuestions };
