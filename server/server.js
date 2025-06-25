const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: "http://localhost:5173", // your frontend URL
    credentials: true,
  }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('FitSync server is running');
});

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.listen(port, () => {
    console.log(`FitSync server is running on port ${port}`);
});
