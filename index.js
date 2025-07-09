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
  try {
    const { userId } = req.body;
    console.log('PROMOTE REQUEST BODY:', userId);

    const roles = await getGroupRoles();
    console.log('GROUP ROLES:', roles);

    const currentRole = await getUserRole(userId);
    console.log('CURRENT ROLE:', currentRole);

    if (!currentRole) {
      console.log('USER NOT IN GROUP');
      return res.status(400).json({ error: 'User not in group' });
    }

    const currentIndex = roles.findIndex(r => r.id === currentRole.id);
    console.log('CURRENT ROLE INDEX:', currentIndex);

    if (currentIndex === -1 || currentIndex >= roles.length - 1) {
      console.log('AT MAX RANK OR NOT FOUND');
      return res.status(400).json({ error: 'User is at highest rank or not found' });
    }

    const nextRole = roles[currentIndex + 1];
    console.log('PROMOTING TO ROLE:', nextRole);

    await updateRole(userId, nextRole.id);
    console.log('PROMOTION SUCCESSFUL');

    res.json({ success: true, message: `User promoted to ${nextRole.name}` });
  } catch (err) {
    console.error('ERROR DURING PROMOTION:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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

app.get('/debug-user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const res1 = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
        const groupData = res1.data.data.find(g => g.group.id == GROUP_ID);
        if (!groupData) return res.status(404).json({ error: 'User not in group' });

        res.json({
            userId: userId,
            groupRole: groupData.role,
            groupRank: groupData.role.rank
        });
    } catch (err) {
        console.error('Debug error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch user role' });
    }
});

app.get('/', (req, res) => {
    res.send('✅ Roblox Rank API is running!');
});

app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
});
