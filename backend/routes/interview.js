const express = require("express");
const router = express.Router();
const {
  startInterview,
  respondToInterview,
  endInterview,
  getSessions,
  getSessionById,
} = require("../controllers/interviewController");
const { protect } = require("../middleware/auth");

// All interview routes require authentication
router.use(protect);

router.post("/start", startInterview);
router.post("/respond", respondToInterview);
router.post("/end", endInterview);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);

module.exports = router;