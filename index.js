const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const API_KEY = process.env.API_KEY;
const GROUP_ID = Number(process.env.GROUP_ID);
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
    const group = res.data.data.find(g => g.group.id === GROUP_ID);
    return group ? group.role : null;
  } catch (err) {
    console.error('Error fetching user role:', err.response?.data || err.message);
    return null;
  }
}

async function updateRole(userId, roleSetId) {
  try {
    const url = `https://apis.roblox.com/groups/v1/groups/${GROUP_ID}/users/${userId}`;
    console.log(`🔁 PATCH to ${url} with roleSetId: ${roleSetId}`);
    
    const response = await axios.patch(url, { roleSetId }, { headers });
    console.log('✅ PATCH success:', response.status);
    return response;
  } catch (err) {
    console.error('❌ PATCH error:');
    console.error(err.response?.data || err.message || err);
    throw err;
  }
}

app.post('/promote', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('[PROMOTE] userId:', userId);

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
  } catch (err) {
    console.error('Error promoting user:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/demote', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('[DEMOTE] userId:', userId);

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
  } catch (err) {
    console.error('Error demoting user:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/debug-user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const res1 = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    const groupData = res1.data.data.find(g => g.group.id === GROUP_ID);

    if (!groupData) return res.status(404).json({ error: 'User not in group' });

    res.json({
      userId,
      groupId: GROUP_ID,
      groupRole: groupData.role.name,
      groupRank: groupData.role.rank,
    });
  } catch (err) {
    console.error('Debug error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch user role', details: err.response?.data || err.message });
  }
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});

console.log('✅ API_KEY loaded:', !!process.env.API_KEY);
console.log('✅ GROUP_ID loaded:', process.env.GROUP_ID);
