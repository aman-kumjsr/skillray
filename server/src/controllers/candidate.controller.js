const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");

const startTest = async (req, res) => {
  try {
    const { token, name, email, accessCode } = req.body;

    // ✅ Basic validation
    if (!token || !name || !email) {
      return res.status(400).json({
        message: "token, name, and email are required",
      });
    }

    // ✅ Fetch test using publicToken
    const test = await prisma.test.findUnique({
      where: { publicToken: token },
    });

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    // ⏳ Expiry check (already implemented earlier)
    const now = new Date();
    if (test.expiresAt && now > new Date(test.expiresAt)) {
      return res.status(403).json({
        message: "Test link has expired",
      });
    }

    // 🔢 ACCESS CODE CHECK (⬅️ THIS IS WHERE YOUR CODE GOES)
    if (test.accessCodeHash) {
      if (!accessCode) {
        return res.status(401).json({
          message: "Test access code is required",
        });
      }

      const isValid = await bcrypt.compare(
        String(accessCode),
        test.accessCodeHash
      );

      if (!isValid) {
        return res.status(401).json({
          message: "Invalid test access code",
        });
      }
    }

    // ✅ Create attempt (only after all checks pass)
    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        candidateName: name,
        candidateEmail: email,
      },
    });

    return res.status(201).json({
      message: "Test started",
      attemptId: attempt.id,
    });
  } catch (error) {
    // Unique constraint: same candidate re-attempt
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "You have already attempted this test",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to start test",
    });
  }
};

const getCandidateTest = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          select: {
            questionId: true,
            selectedOption: true,
          },
        },
        test: {
          include: {
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    text: true,
                    optionA: true,
                    optionB: true,
                    optionC: true,
                    optionD: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    res.json({
      duration: attempt.test.duration,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      autoSubmitOnGraceExpire: attempt.test.autoSubmitOnGraceExpire,
      questions: attempt.test.questions.map((q) => q.question),
      answers: attempt.answers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load test" });
  }
};


module.exports = { startTest, getCandidateTest };
