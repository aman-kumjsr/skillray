const prisma = require("../lib/prisma");
const crypto = require("crypto");
const bcrypt = require("bcrypt");


const createTest = async (req, res) => {
  try {
    const { title, duration, questionIds, expiresAt, accessCode } = req.body;

    if (!title || !duration || !Array.isArray(questionIds)) {
      return res.status(400).json({
        message: "Title, duration, and questionIds are required",
      });
    }

    if (questionIds.length === 0) {
      return res.status(400).json({
        message: "At least one question must be selected",
      });
    }

    let accessCodeHash = null;

    if (accessCode) {
      // Validate 6-digit numeric code
      if (!/^\d{6}$/.test(accessCode)) {
        return res.status(400).json({
          message: "Access code must be exactly 6 digits",
        });
      }

      accessCodeHash = await bcrypt.hash(accessCode, 10);
    }


    // 👇 THIS MUST EXIST
    const token = crypto.randomUUID();

    const test = await prisma.test.create({
      data: {
        title,
        duration,
        createdBy: req.user.userId,
        publicToken: token,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        accessCodeHash,
        questions: {
          create: questionIds.map((qid) => ({
            questionId: qid,
          })),
        },
      },
    });


    // 👇 THIS RESPONSE WAS MISSING OR NEVER REACHED
    return res.status(201).json({
      message: "Test created successfully",
      testId: test.id,
      publicLink: `/test/${test.publicToken}`,
    });


  } catch (error) {
    console.error("CREATE TEST ERROR:", error);
    return res.status(500).json({
      message: "Failed to create test",
    });
  }
};


const getAllTests = async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { createdBy: req.user.userId },
      include: {
        questions: true, // no nested include yet
      },
    });


    res.json(tests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tests",
    });
  }
};

module.exports = { createTest, getAllTests };
