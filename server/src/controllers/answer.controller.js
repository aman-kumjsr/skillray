const prisma = require("../lib/prisma");

const submitAnswers = async (req, res) => {
  try {
    const { attemptId, answers = [] } = req.body;

    if (!attemptId) {
      return res.status(400).json({
        message: "attemptId is required",
      });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: Number(attemptId) },
      include: {
        answers: true,
        test: {
          include: {
            questions: {
              include: { question: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Test attempt not found",
      });
    }

    // 🚫 Already submitted
    if (attempt.completedAt) {
      return res.status(400).json({
        message: "Test already submitted",
      });
    }

    // ⏱️ Time calculation
    const now = new Date();
    const startTime = new Date(attempt.startedAt);
    const durationMs = attempt.test.duration * 60 * 1000;
    const expiryTime = new Date(startTime.getTime() + durationMs);

    const isTimeOver = now > expiryTime;

    // 📝 Save answers ONLY if submitted manually
    if (!isTimeOver && answers.length > 0) {
      for (const ans of answers) {
        await prisma.answer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: ans.questionId,
            },
          },
          update: {
            selectedOption: ans.selectedOption,
          },
          create: {
            attemptId: attempt.id,
            questionId: ans.questionId,
            selectedOption: ans.selectedOption,
          },
        });
      }
    }

    // 🔢 Re-fetch answers for scoring
    const finalAnswers = await prisma.answer.findMany({
      where: { attemptId: attempt.id },
      include: { question: true },
    });

    let score = 0;
    finalAnswers.forEach((ans) => {
      if (ans.selectedOption === ans.question.correctOption) {
        score++;
      }
    });

    // ✅ Mark completed (AUTO or MANUAL)
    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { completedAt: new Date() },
    });

    const timeTakenMinutes = Math.ceil(
      (Math.min(now, expiryTime) - startTime) / 60000
    );

    return res.json({
      message: isTimeOver
        ? "Time over. Test auto-submitted"
        : "Test submitted successfully",
      score,
      total: attempt.test.questions.length,
      timeTakenMinutes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to submit test",
    });
  }
};

module.exports = { submitAnswers };
