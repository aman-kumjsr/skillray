const prisma = require("../lib/prisma");

const getAttemptViolations = async (req, res) => {
  try {
    const { attemptId } = req.params;

    // ✅ FIXED ROLE CHECK
    if (!["COMPANY", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const violations = await prisma.violation.findMany({
      where: { attemptId: Number(attemptId) },
      orderBy: { timestamp: "asc" },
      select: {
        violationId: true,
        type: true,
        count: true,
        timestamp: true,
        createdAt: true,
      },
    });

    return res.json({
      attemptId: Number(attemptId),
      violations,
    });
  } catch (error) {
    console.error("Get violations error:", error);
    return res.status(500).json({ message: "Failed to fetch violations" });
  }
};

module.exports = { getAttemptViolations };
