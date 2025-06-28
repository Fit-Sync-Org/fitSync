const express       = require("express");
const cors          = require("cors");
const dotenv        = require("dotenv");
const cookieParser  = require("cookie-parser");
const authRoutes    = require("./routes/auth");
const requireAuth   = require("./middleware/requireAuth");
// const onboardingRoutes = require("./routes/onboarding");

require("dotenv").config();
const app  = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  "https://fitsync-5tf7.onrender.com",
  "http://localhost:5173",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use(requireAuth);

const onboardingRouter = require("./routes/onboarding");
app.use("/onboarding", onboardingRouter);

const mealsRouter = require("./routes/meals");
app.use("/meals", mealsRouter);

app.get("/", (req, res) => {
  res.send("FitSync server is running");
});

app.listen(port, () => {
  console.log(`FitSync server is running on port ${port}`);
});
