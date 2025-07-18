const express       = require("express");
const cors          = require("cors");
const dotenv        = require("dotenv");
const cookieParser  = require("cookie-parser");
const http = require("http");
const authRoutes    = require("./routes/auth");
const requireAuth   = require("./middleware/requireAuth");
const onboardingRouter = require("./routes/onboarding");
const mealsRouter = require("./routes/meals")
const foodRoutes = require("./routes/foodRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const workoutsRouter = require("./routes/workouts");
const plansRouter = require("./routes/plans");
const notificationsRouter = require("./routes/notifications");
const websocketStatusRouter = require("./routes/websocketStatus");
const webSocketService = require("./services/webSocketService")

require('dotenv').config();
const app  = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

// Set NODE_ENV to production if running on Render
if (process.env.RENDER) {
  process.env.NODE_ENV = 'production';
  console.log('Running in production mode on Render');
} else {
  console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
}

// Handle OPTIONS preflight requests
app.options('*', cors({
  origin: ["https://fitsync-5tf7.onrender.com", "http://localhost:5173"],
  credentials: true,
}));

app.use(cors({
  origin: ["https://fitsync-5tf7.onrender.com", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use(exppress.static(__dirname));

app.get("/", (_req, res) => {
  res.send("FitSync server is running");
});
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/auth", authRoutes);
app.use("/onboarding", onboardingRouter);
app.use("/api/foods", foodRoutes);
app.use("/api/workouts", workoutRoutes);

app.use(requireAuth);
app.use("/api/exercises", workoutsRouter);
app.use("/api/meals", mealsRouter);

app.use("/api/plans", plansRouter);
app.use("/api/ai-plans", require("./routes/ai-plans"));
app.use("/api/notifications", notificationsRouter);
app.use("/api/websocket", websocketStatusRouter);

webSocketService.initialize(server);

server.listen(port, () => {
  console.log(`FitSync server is running on port ${port}`);
  console.log(`Websocket server is ready for connection`)
});
