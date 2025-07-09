const express = require("express");
const router = express.Router();
const mealsController = require("../controllers/mealsController");

router.get("/", mealsController.getMealsByDate);
router.post("/", mealsController.addMeal);
router.put("/:id", mealsController.updateMeal);
router.delete("/:id", mealsController.deleteMeal);

module.exports = router;
