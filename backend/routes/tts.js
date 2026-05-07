const express = require("express");
const router = express.Router();
const { synthesizeSpeech, transcribeAudio, upload, getVoices } = require("../controllers/ttsController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/synthesize", synthesizeSpeech);
router.post("/transcribe", upload.single("audio"), transcribeAudio);
router.get("/voices", getVoices);

module.exports = router;