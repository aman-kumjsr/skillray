const prisma = require("../lib/prisma");

const saveAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, selectedOption } = req.body;

    if (!attemptId || !questionId || !selectedOption) {
      return res.status(400).json({
        message: "attemptId, questionId and selectedOption are required",
      });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: Number(attemptId) },
    });

    if (!attempt || attempt.completedAt) {
      return res.status(400).json({
        message: "Invalid or completed test attempt",
      });
    }

    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: Number(attemptId),
          questionId: Number(questionId),
        },
      },
      update: {
        selectedOption,
      },
      create: {
        attemptId: Number(attemptId),
        questionId: Number(questionId),
        selectedOption,
      },
    });

    return res.json({
      message: "Answer saved",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to save answer",
    });
  }
};

module.exports = { saveAnswer };
