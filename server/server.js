const express       = require("express");
const cors          = require("cors");
const dotenv        = require("dotenv");
const cookieParser  = require("cookie-parser");
const authRoutes    = require("./routes/auth");
const requireAuth   = require("./middleware/requireAuth");
const onboardingRouter = require("./routes/onboarding");
const mealsRouter = require("./routes/meals")
const foodRoutes = require("./routes/foodRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

require('dotenv').config();
const app  = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ["https://fitsync-5tf7.onrender.com", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


app.get("/", (_req, res) => {
  res.send("FitSync server is running");
});
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/auth", authRoutes);
app.use("/onboarding", onboardingRouter);
app.use("/api/foods", foodRoutes);
app.use("/api/workouts", workoutRoutes);

app.use(requireAuth);
app.use("/api/meals", mealsRouter);


app.listen(port, () => {
  console.log(`FitSync server is running on port ${port}`);
});
