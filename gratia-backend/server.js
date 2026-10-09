
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Willkommen beim GRATIA Backend!",
        status: "Server läuft"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "GRATIA Backend ist erreichbar"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`GRATIA Backend läuft auf http://localhost:${PORT}`);
});
