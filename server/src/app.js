require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth.routes");
const authMiddleware = require("./middleware/auth.middleware");
const questionRoutes = require("./routes/question.routes");
const testRoutes = require("./routes/test.routes");
const publicTestRoutes = require("./routes/publicTest.routes");
const candidateRoutes = require("./routes/candidate.routes");
const answerRoutes = require("./routes/answer.routes");
const resultRoutes = require("./routes/result.routes");
const saveAnswerRoutes = require("./routes/saveAnswer.routes");


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "Skillray backend running" });
});

app.get("/test-db", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.use("/api/auth", authRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You have accessed a protected route",
    user: req.user,
  });
});

app.use("/api/questions", questionRoutes);

app.use("/api/tests", testRoutes);

app.use("/api/public", publicTestRoutes);

app.use("/api/candidate", candidateRoutes);

app.use("/api/answers", answerRoutes);

app.use("/api/results", resultRoutes);

app.use("/api/answers", saveAnswerRoutes);


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
