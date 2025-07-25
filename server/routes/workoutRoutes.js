const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/log", async(req, res) => {
  try {
    const nixRes = await axios.post("https://trackapi.nutritionix.com/v2/natural/exercise", req.body, {
      headers: {
        "x-app-id": process.env.NIX_APP_ID,
        "x-app-key": process.env.NIX_APP_KEY,
        "x-remote-user-id": "0",
      }
    });
    res.json(nixRes.data.exercises);
  }
  catch (err) {
    console.error("Nutritionix exercise error:", err.response?.data || err.message);
    res.status(500).json({ error: "Exercise lookup failed" });
  }
});

module.exports = router;
