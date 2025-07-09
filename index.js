const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;
const GROUP_ID = process.env.GROUP_ID;

app.get('/get-rank/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const response = await axios.get(
            `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/users/${userId}/roles`,
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        const role = response.data.role;
        res.json({ success: true, role });
    } catch (err) {
        res.status(500).json({ success: false, error: err.response?.data || err.message });
    }
});

app.post('/set-rank', async (req, res) => {
    const { userId, roleId } = req.body;
    try {
        await axios.patch(
            `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/users/${userId}/roles`,
            {
                roleId: roleId,
            },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ success: true, message: `User ${userId} ranked to role ID ${roleId}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.response?.data || err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Rank API is running on port ${PORT}`));
