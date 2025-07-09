const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const API_KEY = process.env.API_KEY;
const GROUP_ID = process.env.GROUP_ID;
const PORT = process.env.PORT || 3000;

const headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
};

async function getGroupRoles() {
    const res = await axios.get(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`);
    return res.data.roles;
}

async function getUserRole(userId) {
    try {
        const res = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
        const group = res.data.data.find(g => g.group.id == GROUP_ID);
        return group ? group.role : null;
    } catch (err) {
        return null;
    }
}

async function updateRole(userId, roleSetId) {
    return axios.patch(
        `https://apis.roblox.com/groups/v1/groups/${GROUP_ID}/users/${userId}`,
        { roleSetId },
        { headers }
    );
}

app.post('/promote', async (req, res) => {
    const { userId } = req.body;

    const roles = await getGroupRoles();
    const currentRole = await getUserRole(userId);
    if (!currentRole) return res.status(400).json({ error: 'User not in group' });

    const currentIndex = roles.findIndex(r => r.id === currentRole.id);
    if (currentIndex === -1 || currentIndex >= roles.length - 1) {
        return res.status(400).json({ error: 'User is at highest rank or not found' });
    }

    const nextRole = roles[currentIndex + 1];
    await updateRole(userId, nextRole.id);
    res.json({ success: true, message: `User promoted to ${nextRole.name}` });
});

app.post('/demote', async (req, res) => {
    const { userId } = req.body;

    const roles = await getGroupRoles();
    const currentRole = await getUserRole(userId);
    if (!currentRole) return res.status(400).json({ error: 'User not in group' });

    const currentIndex = roles.findIndex(r => r.id === currentRole.id);
    if (currentIndex <= 0) {
        return res.status(400).json({ error: 'User is at lowest rank or not found' });
    }

    const prevRole = roles[currentIndex - 1];
    await updateRole(userId, prevRole.id);
    res.json({ success: true, message: `User demoted to ${prevRole.name}` });
});

app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
});
