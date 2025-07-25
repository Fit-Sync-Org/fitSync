const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/search", async(req, res) => {
  const { query } = req.query;
  if (!query) {return res.status(400).json({ message: "query is required" });}

  try {
    const nixRes = await axios.get("https://trackapi.nutritionix.com/v2/search/instant", {
      params: { query, common: true, branded: false },
      headers: {
        "x-app-id": process.env.NIX_APP_ID,
        "x-app-key": process.env.NIX_APP_KEY,
        "x-remote-user-id": "0"
      }
    });

    res.json(nixRes.data.common);
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error("[Nutritionix]", status, data || err.message);
    res.status(status || 500).json({
      message: "Nutritionix lookup failed",
      details: data || err.message
    });
  }
});

router.post("/nutrients", async(req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  try {
    const nixRes = await axios.post(
      "https://trackapi.nutritionix.com/v2/natural/nutrients",
      { query },
      {
        headers: {
          "x-app-id":  process.env.NIX_APP_ID,
          "x-app-key": process.env.NIX_APP_KEY,
          "x-remote-user-id": "0",
          "Content-Type": "application/json"
        }
      }
    );
    res.json(nixRes.data.foods[0]);
  } catch (err) {
    console.error("[Nutritionix nutrients]", err.response?.data || err.message);
    res.status(500).json({ message: "nutrient lookup failed" });
  }
});
module.exports = router;
