import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getFirestoreDb } from './firebase.ts';
import { PRESET_THEMES } from './src/data/mockData.ts';
import { CardProfile, UserAccount, AdminAccount } from './src/types.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure default Firestore seed data (ONLY default admin account if admins collection is empty)
async function ensureSeedData() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.warn('Firestore is not configured. Skipping seed.');
      return;
    }

    // 1. Check if admins collection is empty
    const adminsSnap = await db.collection('admins').limit(1).get();
    if (adminsSnap.empty) {
      console.log('Firestore admins collection is empty. Creating default admin account...');
      const defaultAdmin: AdminAccount & { password: string } = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@cardbiz.com',
        role: 'super_admin',
        password: 'admin123',
        createdAt: new Date().toISOString(),
      };
      await db.collection('admins').doc('admin-1').set(defaultAdmin);
      console.log('Default admin initialized in Firestore (admin / admin123).');
    }

    // 2. Check if settings doc exists
    const settingsRef = db.collection('settings').doc('app_settings');
    const settingsDoc = await settingsRef.get();
    if (!settingsDoc.exists) {
      const cardsSnap = await db.collection('cards').limit(1).get();
      let defaultCardId = '';
      if (!cardsSnap.empty) {
        defaultCardId = cardsSnap.docs[0].id;
      }
      await settingsRef.set({ activeFrontCardId: defaultCardId });
    }
  } catch (err: any) {
    console.warn('Firestore seed/connection notice on startup:', err?.message || err);
  }
}

// Token Helpers
function parseAuthToken(req: express.Request): { userId: string; role: 'user' | 'admin' } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return decoded;
  } catch (e) {
    return null;
  }
}

function createAuthToken(userId: string, role: 'user' | 'admin'): string {
  return Buffer.from(JSON.stringify({ userId, role, time: Date.now() })).toString('base64');
}

// ==================== API ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'firestore',
    time: new Date().toISOString(),
  });
});

// App Settings (Front Page Preview Card)
app.get('/api/settings', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.json({ activeFrontCardId: '' });
    const doc = await db.collection('settings').doc('app_settings').get();
    if (doc.exists && doc.data()?.activeFrontCardId) {
      return res.json({ activeFrontCardId: doc.data()!.activeFrontCardId });
    }
    return res.json({ activeFrontCardId: '' });
  } catch (err: any) {
    console.warn('Firestore settings fetch notice:', err?.message || err);
    res.json({ activeFrontCardId: '' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { activeFrontCardId } = req.body;
    if (!activeFrontCardId) {
      return res.status(400).json({ error: 'activeFrontCardId is required' });
    }

    const db = getFirestoreDb();
    if (!db) {
      return res.status(503).json({ error: 'Firestore is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.' });
    }
    await db.collection('settings').doc('app_settings').set(
      { activeFrontCardId },
      { merge: true }
    );

    res.json({ success: true, activeFrontCardId });
  } catch (err: any) {
    console.error('Firestore settings update error:', err?.message || err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUser = username.trim().toLowerCase();
    const db = getFirestoreDb();
    if (!db) {
      return res.status(503).json({ error: 'Firestore is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.' });
    }

    // 1. Check admins in Firestore
    const adminsSnap = await db.collection('admins').get();
    const adminDoc = adminsSnap.docs.find(d => {
      const data = d.data();
      return (
        data.username?.toLowerCase() === cleanUser ||
        (data.email && data.email.toLowerCase() === cleanUser)
      );
    });

    if (adminDoc) {
      const adminData = adminDoc.data();
      const savedPass = adminData.password || 'admin123';
      if (savedPass === password) {
        const token = createAuthToken(adminData.id, 'admin');
        return res.json({
          user: {
            id: adminData.id,
            username: adminData.username,
            email: adminData.email,
            role: 'admin',
          },
          token,
        });
      }
    }

    // 2. Check users in Firestore
    const usersSnap = await db.collection('users').get();
    const userDoc = usersSnap.docs.find(d => {
      const data = d.data();
      return (
        data.username?.toLowerCase() === cleanUser ||
        (data.email && data.email.toLowerCase() === cleanUser)
      );
    });

    if (userDoc) {
      const userData = userDoc.data();
      const savedPass = userData.password || 'user123';
      if (savedPass === password) {
        const token = createAuthToken(userData.id, 'user');

        let userCard = null;
        if (userData.cardId) {
          const cardDoc = await db.collection('cards').doc(userData.cardId).get();
          if (cardDoc.exists) {
            userCard = cardDoc.data();
          }
        }
        if (!userCard) {
          const cardsSnap = await db.collection('cards').where('username', '==', userData.username.toLowerCase()).get();
          if (!cardsSnap.empty) {
            userCard = cardsSnap.docs[0].data();
          }
        }

        return res.json({
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            role: 'user',
            cardId: userData.cardId,
          },
          card: userCard,
          token,
        });
      }
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (err: any) {
    console.error('Login error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Login failed due to database error' });
  }
});

// Session Auth /me
app.get('/api/auth/me', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    if (auth.role === 'admin') {
      const adminDoc = await db.collection('admins').doc(auth.userId).get();
      if (adminDoc.exists) {
        const admin = adminDoc.data()!;
        return res.json({
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: 'admin',
          },
        });
      }
      return res.status(404).json({ error: 'Admin account not found' });
    } else {
      const userDoc = await db.collection('users').doc(auth.userId).get();
      if (userDoc.exists) {
        const user = userDoc.data()!;
        let userCard = null;
        if (user.cardId) {
          const cardDoc = await db.collection('cards').doc(user.cardId).get();
          if (cardDoc.exists) userCard = cardDoc.data();
        }
        if (!userCard) {
          const cardsSnap = await db.collection('cards').where('username', '==', user.username.toLowerCase()).get();
          if (!cardsSnap.empty) userCard = cardsSnap.docs[0].data();
        }
        return res.json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: 'user',
            cardId: user.cardId,
          },
          card: userCard,
        });
      }
      return res.status(404).json({ error: 'User account not found' });
    }
  } catch (err: any) {
    console.error('Auth /me error:', err?.message || err);
    res.status(500).json({ error: 'Failed to verify auth session' });
  }
});

// List Cards
app.get('/api/cards', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.json([]);
    const cardsSnap = await db.collection('cards').get();
    const cards = cardsSnap.docs.map(d => d.data());
    res.json(cards);
  } catch (err: any) {
    console.warn('Firestore get cards notice:', err?.message || err);
    res.json([]);
  }
});

// Get Card by Username
app.get('/api/cards/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanU = username.toLowerCase();
    const db = getFirestoreDb();
    if (!db) return res.status(404).json({ error: 'Card not found' });

    const cardsSnap = await db.collection('cards').get();
    const cardDoc = cardsSnap.docs.find(d => d.data().username?.toLowerCase() === cleanU);
    if (cardDoc) {
      return res.json(cardDoc.data());
    }

    res.status(404).json({ error: 'Card not found' });
  } catch (err: any) {
    console.warn('Firestore get card by username notice:', err?.message || err);
    res.status(404).json({ error: 'Card not found' });
  }
});

// Record Tap Event
app.post('/api/cards/:username/tap', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanU = username.toLowerCase();
    const { linkPlatform } = req.body || {};

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    const cardsSnap = await db.collection('cards').get();
    const cardDoc = cardsSnap.docs.find(d => d.data().username?.toLowerCase() === cleanU);

    if (!cardDoc) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = cardDoc.data() as CardProfile;
    if (!card.stats) card.stats = { totalTaps: 0, linkClicks: {} };
    if (!card.stats.linkClicks) card.stats.linkClicks = {};

    if (linkPlatform) {
      card.stats.linkClicks[linkPlatform] = (card.stats.linkClicks[linkPlatform] || 0) + 1;
    } else {
      card.stats.totalTaps = (card.stats.totalTaps || 0) + 1;
      card.stats.lastTappedAt = new Date().toISOString();
    }

    await db.collection('cards').doc(card.id).update({ stats: card.stats });
    res.json({ success: true, stats: card.stats });
  } catch (err: any) {
    console.error('Firestore tap update failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to record tap' });
  }
});

// Download vCard
app.get('/api/cards/:username/vcard', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanU = username.toLowerCase();

    const db = getFirestoreDb();
    if (!db) return res.status(404).send('Card profile not found');

    const cardsSnap = await db.collection('cards').get();
    const doc = cardsSnap.docs.find(d => d.data().username?.toLowerCase() === cleanU);

    if (!doc) {
      return res.status(404).send('Card profile not found');
    }

    const card = doc.data() as CardProfile;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${card.fullName}
N:${card.fullName};;;;
TITLE:${card.jobTitle}
ORG:${card.company || ''}
TEL;TYPE=CELL,VOICE:${card.quickActions?.phone || card.vcardData?.mobilePhone || ''}
TEL;TYPE=WORK,VOICE:${card.vcardData?.workPhone || ''}
EMAIL;TYPE=WORK,INTERNET:${card.quickActions?.email || card.vcardData?.email || ''}
URL:${card.vcardData?.website || ''}
NOTE:${card.bio || ''}
END:VCARD`;

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${card.username}_contact.vcf"`);
    res.send(vcard);
  } catch (e: any) {
    console.error('Firestore vcard fetch error:', e?.message || e);
    res.status(500).send('Error generating vCard');
  }
});

// Update User Profile
app.put('/api/user/profile', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const targetCardId = req.body.id;
    if (!targetCardId) return res.status(400).json({ error: 'Card ID required' });

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    const cardRef = db.collection('cards').doc(targetCardId);
    const doc = await cardRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Card profile not found' });
    }

    const updated = { ...doc.data(), ...req.body };
    await cardRef.set(updated, { merge: true });
    res.json({ success: true, card: updated });
  } catch (err: any) {
    console.error('Update profile error:', err?.message || err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
app.put('/api/user/password', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    const col = auth.role === 'admin' ? 'admins' : 'users';
    const docRef = db.collection(col).doc(auth.userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await docRef.update({ password: newPassword });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Update password error:', err?.message || err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin Stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const db = getFirestoreDb();
    if (!db) return res.json({ totalUsers: 0, totalCards: 0, totalTaps: 0, totalAdmins: 0 });

    const [uSnap, cSnap, aSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('cards').get(),
      db.collection('admins').get(),
    ]);

    const totalTaps = cSnap.docs.reduce((acc, doc) => acc + (doc.data().stats?.totalTaps || 0), 0);
    res.json({
      totalUsers: uSnap.size,
      totalCards: cSnap.size,
      totalTaps,
      totalAdmins: aSnap.size,
    });
  } catch (err: any) {
    console.warn('Firestore admin stats notice:', err?.message || err);
    res.json({ totalUsers: 0, totalCards: 0, totalTaps: 0, totalAdmins: 0 });
  }
});

// Admin Get Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const db = getFirestoreDb();
    if (!db) return res.json([]);

    const [uSnap, cSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('cards').get(),
    ]);

    const cMap = new Map();
    cSnap.docs.forEach(d => cMap.set(d.id, d.data()));

    const result = uSnap.docs.map(d => {
      const u = d.data();
      return {
        ...u,
        card: cMap.get(u.cardId),
        currentPassword: u.password || 'user123',
      };
    });

    res.json(result);
  } catch (err: any) {
    console.warn('Firestore admin get users notice:', err?.message || err);
    res.json([]);
  }
});

// Admin Create User
app.post('/api/admin/users', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { fullName, username, email, password, jobTitle, company, phone } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'Full name, username, and password are required' });
    }

    const cleanU = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const newCardId = 'card-' + Date.now();
    const newUserId = 'u-' + Date.now();

    const newCard: CardProfile = {
      id: newCardId,
      username: cleanU,
      fullName,
      jobTitle: jobTitle || 'Professional',
      company: company || '',
      bio: `Welcome to ${fullName}'s digital business card.`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanU}`,
      quickActions: {
        phone: phone || '',
        email: email || '',
        sms: phone || '',
        whatsapp: phone ? phone.replace(/[^0-9]/g, '') : '',
      },
      links: [
        { id: 'l1', platform: 'whatsapp', title: 'WhatsApp Direct', subtitle: 'Chat with me', url: `https://wa.me/${phone || ''}`, active: true },
        { id: 'l2', platform: 'website', title: 'Website', subtitle: 'Visit my official website', url: 'https://example.com', active: true },
      ],
      theme: PRESET_THEMES[0],
      vcardData: { mobilePhone: phone || '', email: email || '', organization: company || '' },
      stats: { totalTaps: 0, linkClicks: {} },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const newUser: UserAccount & { password?: string } = {
      id: newUserId,
      username: cleanU,
      email: email || `${cleanU}@example.com`,
      role: 'user',
      cardId: newCardId,
      password,
      createdAt: new Date().toISOString(),
    };

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    await Promise.all([
      db.collection('cards').doc(newCardId).set(newCard),
      db.collection('users').doc(newUserId).set(newUser),
    ]);

    res.status(201).json({ success: true, user: newUser, card: newCard });
  } catch (err: any) {
    console.error('Firestore user creation failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Admin Update User
app.put('/api/admin/users/:userId', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { userId } = req.params;
    const { username, email, cardData, password } = req.body;

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    const uRef = db.collection('users').doc(userId);
    const uDoc = await uRef.get();

    if (!uDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: any = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (password) updates.password = password;
    await uRef.update(updates);

    const cardId = uDoc.data()!.cardId;
    if (cardId && cardData) {
      await db.collection('cards').doc(cardId).set(cardData, { merge: true });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Firestore update user failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin Update User Password
app.put('/api/admin/users/:userId/password', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    await db.collection('users').doc(userId).update({ password: newPassword });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Firestore password update failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Admin Delete User
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { userId } = req.params;
    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    const uDoc = await db.collection('users').doc(userId).get();

    if (uDoc.exists) {
      const cId = uDoc.data()!.cardId;
      await Promise.all([
        db.collection('users').doc(userId).delete(),
        cId ? db.collection('cards').doc(cId).delete() : Promise.resolve(),
      ]);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Firestore user deletion failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin Team Get
app.get('/api/admin/admins', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const db = getFirestoreDb();
    if (!db) return res.json([]);

    const aSnap = await db.collection('admins').get();
    const result = aSnap.docs.map(d => {
      const a = d.data();
      return {
        ...a,
        currentPassword: a.password || 'admin123',
      };
    });

    res.json(result);
  } catch (err: any) {
    console.warn('Firestore admin fetch notice:', err?.message || err);
    res.json([]);
  }
});

// Admin Team Add
app.post('/api/admin/admins', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { username, email, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const cleanU = username.trim().toLowerCase();
    const newAdminId = 'admin-' + Date.now();

    const newAdmin: AdminAccount & { password?: string } = {
      id: newAdminId,
      username: cleanU,
      email: email || `${cleanU}@cardbiz.com`,
      role: 'admin',
      password,
      createdAt: new Date().toISOString(),
    };

    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    await db.collection('admins').doc(newAdminId).set(newAdmin);

    res.status(201).json({ success: true, admin: newAdmin });
  } catch (err: any) {
    console.error('Firestore admin creation failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Admin Team Delete
app.delete('/api/admin/admins/:adminId', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { adminId } = req.params;
    const db = getFirestoreDb();
    if (!db) return res.status(503).json({ error: 'Firestore is not configured' });

    await db.collection('admins').doc(adminId).delete();

    res.json({ success: true, message: 'Admin deleted' });
  } catch (err: any) {
    console.error('Firestore admin deletion failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ==================== VITE & STATIC SERVING ====================

async function startServer() {
  await ensureSeedData();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NFC Card System backend with Firebase Firestore running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
