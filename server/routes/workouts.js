const express = require("express");
const router = express.Router();
const workoutController = require("../controllers/workoutController");

router.get("/", workoutController.getWorkoutByDate);
router.post("/", workoutController.addWorkout);
router.put("/:id", workoutController.updateWorkout);
router.delete("/:id", workoutController.deleteWorkout);
router.post("/complete-entry", workoutController.completeEntry);
router.get("/completed-entries", workoutController.getCompletedEntries);

module.exports = router;
