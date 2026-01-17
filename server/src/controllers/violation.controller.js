const prisma = require("../lib/prisma");

const logViolation = async (req, res) => {
  try {
    const { attemptId, type, count, timestamp } = req.body;

    if (
      attemptId === undefined ||
      !type ||
      count === undefined ||
      !timestamp
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await prisma.violation.create({
      data: {
        attemptId: Number(attemptId),
        type,
        count: Number(count),
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
