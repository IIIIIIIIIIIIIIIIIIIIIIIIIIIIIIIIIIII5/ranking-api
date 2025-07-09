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

app.post('/promote', async (req, res) => {
    const { userId } = req.body;

    try {
        const roleRes = await axios.get(
            `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/users/${userId}/roles`,
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        const currentRoleId = roleRes.data.role.id;

        const allRolesRes = await axios.get(
            `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/roles`,
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        const roles = allRolesRes.data.roles;
        const currentIndex = roles.findIndex(role => role.id === currentRoleId);

        if (currentIndex === -1 || currentIndex === roles.length - 1) {
            return res.status(400).json({ success: false, message: 'User is already at the highest rank or role not found.' });
        }

        const nextRoleId = roles[currentIndex + 1].id;

        await axios.patch(
            `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/users/${userId}/roles`,
            {
                roleId: nextRoleId
            },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({
            success: true,
            message: `User ${userId} promoted to role ID ${nextRoleId}`
        });

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
