const express = require("express");
const { startTest } = require("../controllers/candidate.controller");
const {getCandidateTest} = require("../controllers/candidate.controller");

const router = express.Router();

router.post("/start", startTest);
router.get("/test/:attemptId", getCandidateTest);


module.exports = router;
