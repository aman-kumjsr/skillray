const prisma = require("../lib/prisma");

const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ message: "testId is required" });
    }

    // Ensure test belongs to logged-in user
    const test = await prisma.test.findFirst({
      where: {
        id: Number(testId),
        createdBy: req.user.userId,
      },
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Fetch attempts with answers
    const attempts = await prisma.testAttempt.findMany({
      where: { testId: Number(testId) },
      include: {
        answers: {
          include: { question: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const results = attempts.map((attempt) => {
      let score = 0;

      attempt.answers.forEach((ans) => {
        if (ans.selectedOption === ans.question.correctOption) {
          score++;
        }
      });

      return {
        attemptId: attempt.id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        score,
        total: attempt.answers.length,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      };
    });

    return res.json({
      testId: test.id,
      results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch results" });
  }
};

module.exports = { getTestResults };
