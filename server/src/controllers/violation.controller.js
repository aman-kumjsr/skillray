const prisma = require("../lib/prisma");

const logViolation = async (req, res) => {
  try {
    const { attemptId, type, count, timestamp } = req.body;
    const userId = req.user.userId; // ✅ THIS IS THE FIX

    if (!attemptId || !type || !count || !timestamp) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ verify attempt ownership
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: Number(attemptId) },
      select: { userId: true },
    });

    if (!attempt) {
      return res.status(404).json({ message: "Test attempt not found" });
    }

    if (attempt.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized attempt access" });
    }

    // ✅ log violation
    await prisma.violation.create({
      data: {
        attemptId: Number(attemptId),
        type,
        count,
        timestamp: new Date(timestamp),
      },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Violation log error:", error);
    return res.status(200).json({ success: false });
  }
};

module.exports = { logViolation };
