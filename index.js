const express = require("express");
const noblox = require("noblox.js");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT;

const GROUP_ID = process.env.GROUPID;
const TARGET_RANK = process.env.RANK;
const PASS_PERCENTAGE = process.env.PERCENTAGE;

const COOKIE = process.env.COOKIE;

app.use(cors());
app.use(bodyParser.json());

async function login() {
    try {
        await noblox.setCookie(COOKIE);
        const user = await noblox.getCurrentUser();
        console.log(`✅ Logged in as ${user.UserName}`);
    } catch (err) {
        console.error("❌ Failed to log in:", err.message);
    }
}

app.post("/apply", async (req, res) => {
    const { userId, username, percentage } = req.body;

    if (!userId || !username || percentage == nil) {
        return res.status(400).json({ success: false, message: "Missing fields." });
    }

    if (percentage < PASS_PERCENTAGE) {
        return res.json({ success: false, message: "Quiz failed. Score too low." });
    }

    try {
        await noblox.setRank(GROUP_ID, userId, TARGET_RANK);
        console.log(`✅ Ranked ${username} (ID: ${userId}) to Correctional Officer`);
        return res.json({ success: true, message: "Ranked successfully." });
    } catch (err) {
        console.error("❌ Error ranking user:", err.message);
        return res.status(500).json({ success: false, message: "Ranking failed." });
    }
});

app.listen(port, () => {
    console.log(`🚀 API running on port ${port}`);
    login();
});
