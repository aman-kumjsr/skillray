const prisma = require("../lib/prisma");

const getPublicTest = async (req, res) => {
  try {
    const { token } = req.params;

    // ✅ Validate token
    if (!token) {
      return res.status(400).json({
        message: "Test token is required",
      });
    }

    // ✅ Fetch test using publicToken
    const test = await prisma.test.findUnique({
      where: { publicToken: token },
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
    });

    // ❌ Test not found
    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    // ⏳ EXPIRY CHECK (IMPORTANT)
    const now = new Date();

    if (test.expiresAt && now > new Date(test.expiresAt)) {
      return res.status(403).json({
        message: "This test link has expired",
      });
    }

    // ✅ Send public-safe response (no answers leaked)
    return res.json({
      testId: test.id,
      title: test.title,
      duration: test.duration,
      requiresAccessCode: Boolean(test.accessCodeHash),
      questions: test.questions.map((q) => q.question),
    });

  } catch (error) {
    console.error("PUBLIC TEST ERROR:", error);
    return res.status(500).json({
      message: "Failed to load test",
    });
  }
};

module.exports = { getPublicTest };
