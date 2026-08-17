import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { getFirestoreDb } from './firebase.ts';
import { PRESET_THEMES } from './src/data/mockData.ts';
import { CardProfile, UserAccount, AdminAccount } from './src/types.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ==================== AI CLIENTS (GEMINI & GROQ) ====================
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

let groqClient: Groq | null = null;
function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ==================== IN-MEMORY FALLBACK STORE ====================
// Used automatically when Firestore credentials are not set
const defaultCard: CardProfile = {
  id: 'card-joshua',
  username: 'joshua',
  fullName: 'Joshua Thomas',
  jobTitle: 'Chief Executive Officer',
  company: 'Apex Dynamics Inc.',
  bio: 'Serial entrepreneur, tech investor, and advisor. Passionate about building scalable platforms and driving innovation.',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
  quickActions: {
    phone: '+1 (555) 234-5678',
    email: 'joshua@apexdynamics.com',
    sms: '+15552345678',
    whatsapp: '15552345678',
  },
  links: [
    { id: 'l1', platform: 'whatsapp', title: 'WhatsApp Direct', subtitle: 'Chat with Joshua', url: 'https://wa.me/15552345678', active: true },
    { id: 'l2', platform: 'linkedin', title: 'LinkedIn Profile', subtitle: 'Connect professionally', url: 'https://linkedin.com', active: true },
    { id: 'l3', platform: 'website', title: 'Apex Dynamics', subtitle: 'Company website', url: 'https://example.com', active: true },
  ],
  theme: PRESET_THEMES[0],
  vcardData: {
    mobilePhone: '+1 (555) 234-5678',
    workPhone: '+1 (555) 987-6543',
    email: 'joshua@apexdynamics.com',
    website: 'https://apexdynamics.com',
    organization: 'Apex Dynamics Inc.',
  },
  stats: { totalTaps: 42, linkClicks: { whatsapp: 15, linkedin: 18, website: 9 } },
  isActive: true,
  createdAt: new Date().toISOString(),
};

const defaultUser: UserAccount & { password?: string } = {
  id: 'u-joshua',
  username: 'joshua',
  email: 'joshua@apexdynamics.com',
  role: 'user',
  cardId: 'card-joshua',
  password: 'user123',
  createdAt: new Date().toISOString(),
};

const defaultAdmin: AdminAccount & { password?: string } = {
  id: 'admin-1',
  username: 'admin',
  email: 'admin@cardbiz.com',
  role: 'super_admin',
  password: 'admin123',
  createdAt: new Date().toISOString(),
};

const inMemoryCards = new Map<string, CardProfile>([['card-joshua', defaultCard]]);
const inMemoryUsers = new Map<string, UserAccount & { password?: string }>([['u-joshua', defaultUser]]);
const inMemoryAdmins = new Map<string, AdminAccount & { password?: string }>([['admin-1', defaultAdmin]]);
let inMemorySettings = { activeFrontCardId: 'card-joshua' };

// Ensure default Firestore seed data if Firestore is configured
async function ensureSeedData() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.log('Firestore not configured — active in in-memory fallback mode.');
      return;
    }

    // 1. Check if admins collection is empty
    const adminsSnap = await db.collection('admins').limit(1).get();
    if (adminsSnap.empty) {
      console.log('Firestore admins collection is empty. Creating default admin account...');
      await db.collection('admins').doc('admin-1').set(defaultAdmin);
      console.log('Default admin initialized in Firestore (admin / admin123).');
    }

    // 2. Check if default user and card exist
    const cardsSnap = await db.collection('cards').limit(1).get();
    if (cardsSnap.empty) {
      await db.collection('cards').doc(defaultCard.id).set(defaultCard);
      await db.collection('users').doc(defaultUser.id).set(defaultUser);
    }

    // 3. Check if settings doc exists
    const settingsRef = db.collection('settings').doc('app_settings');
    const settingsDoc = await settingsRef.get();
    if (!settingsDoc.exists) {
      await settingsRef.set({ activeFrontCardId: 'card-joshua' });
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
  const db = getFirestoreDb();
  res.json({
    status: 'ok',
    database: db ? 'firestore' : 'in-memory',
    time: new Date().toISOString(),
  });
});

// App Settings (Front Page Preview Card)
app.get('/api/settings', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.json(inMemorySettings);
    const doc = await db.collection('settings').doc('app_settings').get();
    if (doc.exists && doc.data()?.activeFrontCardId) {
      return res.json({ activeFrontCardId: doc.data()!.activeFrontCardId });
    }
    return res.json(inMemorySettings);
  } catch (err: any) {
    console.warn('Firestore settings fetch notice:', err?.message || err);
    res.json(inMemorySettings);
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { activeFrontCardId } = req.body;
    if (!activeFrontCardId) {
      return res.status(400).json({ error: 'activeFrontCardId is required' });
    }

    inMemorySettings.activeFrontCardId = activeFrontCardId;

    const db = getFirestoreDb();
    if (db) {
      await db.collection('settings').doc('app_settings').set(
        { activeFrontCardId },
        { merge: true }
      );
    }

    res.json({ success: true, activeFrontCardId });
  } catch (err: any) {
    console.error('Settings update error:', err?.message || err);
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

    if (db) {
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
    }

    // In-memory fallback authentication
    for (const admin of inMemoryAdmins.values()) {
      if (admin.username.toLowerCase() === cleanUser || admin.email.toLowerCase() === cleanUser) {
        if ((admin.password || 'admin123') === password) {
          const token = createAuthToken(admin.id, 'admin');
          return res.json({
            user: {
              id: admin.id,
              username: admin.username,
              email: admin.email,
              role: 'admin',
            },
            token,
          });
        }
      }
    }

    for (const user of inMemoryUsers.values()) {
      if (user.username.toLowerCase() === cleanUser || user.email.toLowerCase() === cleanUser) {
        if ((user.password || 'user123') === password) {
          const token = createAuthToken(user.id, 'user');
          const card = user.cardId ? inMemoryCards.get(user.cardId) || null : null;
          return res.json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: 'user',
              cardId: user.cardId,
            },
            card,
            token,
          });
        }
      }
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (err: any) {
    console.error('Login error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

// Session Auth /me
app.get('/api/auth/me', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const db = getFirestoreDb();
    if (db) {
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
      }
    }

    // In-memory auth lookup
    if (auth.role === 'admin') {
      const admin = inMemoryAdmins.get(auth.userId);
      if (admin) {
        return res.json({
          user: { id: admin.id, username: admin.username, email: admin.email, role: 'admin' },
        });
      }
    } else {
      const user = inMemoryUsers.get(auth.userId);
      if (user) {
        const card = user.cardId ? inMemoryCards.get(user.cardId) || null : null;
        return res.json({
          user: { id: user.id, username: user.username, email: user.email, role: 'user', cardId: user.cardId },
          card,
        });
      }
    }

    return res.status(404).json({ error: 'Account not found' });
  } catch (err: any) {
    console.error('Auth /me error:', err?.message || err);
    res.status(500).json({ error: 'Failed to verify auth session' });
  }
});

// List Cards
app.get('/api/cards', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (db) {
      const cardsSnap = await db.collection('cards').get();
      const cards = cardsSnap.docs.map(d => d.data());
      if (cards.length > 0) return res.json(cards);
    }
    res.json(Array.from(inMemoryCards.values()));
  } catch (err: any) {
    console.warn('Get cards notice:', err?.message || err);
    res.json(Array.from(inMemoryCards.values()));
  }
});

// Get Card by Username
app.get('/api/cards/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanU = username.toLowerCase();
    const db = getFirestoreDb();

    if (db) {
      const cardsSnap = await db.collection('cards').get();
      const cardDoc = cardsSnap.docs.find(d => d.data().username?.toLowerCase() === cleanU);
      if (cardDoc) return res.json(cardDoc.data());
    }

    for (const card of inMemoryCards.values()) {
      if (card.username.toLowerCase() === cleanU || card.id.toLowerCase() === cleanU || card.id.toLowerCase() === `card-${cleanU}`) {
        return res.json(card);
      }
    }

    res.status(404).json({ error: 'Card not found' });
  } catch (err: any) {
    console.warn('Get card by username notice:', err?.message || err);
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

    if (db) {
      const cardsSnap = await db.collection('cards').get();
      const cardDoc = cardsSnap.docs.find(d => d.data().username?.toLowerCase() === cleanU);

      if (cardDoc) {
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
        return res.json({ success: true, stats: card.stats });
      }
    }

    // Fallback in-memory tap record
    for (const card of inMemoryCards.values()) {
      if (card.username.toLowerCase() === cleanU) {
        if (!card.stats) card.stats = { totalTaps: 0, linkClicks: {} };
        if (!card.stats.linkClicks) card.stats.linkClicks = {};

        if (linkPlatform) {
          card.stats.linkClicks[linkPlatform] = (card.stats.linkClicks[linkPlatform] || 0) + 1;
        } else {
          card.stats.totalTaps = (card.stats.totalTaps || 0) + 1;
          card.stats.lastTappedAt = new Date().toISOString();
        }

        return res.json({ success: true, stats: card.stats });
      }
    }

    res.status(404).json({ error: 'Card not found' });
  } catch (err: any) {
    console.error('Tap update failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to record tap' });
  }
});

// Download vCard
app.get('/api/cards/:username/vcard', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanU = username.toLowerCase();

    let card: CardProfile | null = null;
    const db = getFirestoreDb();

    if (db) {
      const cardsSnap = await db.collection('cards').get();
      const doc = cardsSnap.docs.find(d => d.data().username?.toLowerCase() === cleanU);
      if (doc) card = doc.data() as CardProfile;
    }

    if (!card) {
      for (const c of inMemoryCards.values()) {
        if (c.username.toLowerCase() === cleanU) {
          card = c;
          break;
        }
      }
    }

    if (!card) return res.status(404).send('Card profile not found');

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
    console.error('Vcard fetch error:', e?.message || e);
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
    if (db) {
      const cardRef = db.collection('cards').doc(targetCardId);
      const doc = await cardRef.get();
      if (doc.exists) {
        const updated = { ...doc.data(), ...req.body };
        await cardRef.set(updated, { merge: true });
        return res.json({ success: true, card: updated });
      }
    }

    const existingCard = inMemoryCards.get(targetCardId);
    if (existingCard) {
      const updated = { ...existingCard, ...req.body };
      inMemoryCards.set(targetCardId, updated);
      return res.json({ success: true, card: updated });
    }

    res.status(404).json({ error: 'Card profile not found' });
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
    if (db) {
      const col = auth.role === 'admin' ? 'admins' : 'users';
      const docRef = db.collection(col).doc(auth.userId);
      const doc = await docRef.get();
      if (doc.exists) {
        await docRef.update({ password: newPassword });
        return res.json({ success: true, message: 'Password updated successfully' });
      }
    }

    if (auth.role === 'admin') {
      const admin = inMemoryAdmins.get(auth.userId);
      if (admin) {
        admin.password = newPassword;
        return res.json({ success: true, message: 'Password updated successfully' });
      }
    } else {
      const user = inMemoryUsers.get(auth.userId);
      if (user) {
        user.password = newPassword;
        return res.json({ success: true, message: 'Password updated successfully' });
      }
    }

    res.status(404).json({ error: 'Account not found' });
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
    if (db) {
      const [uSnap, cSnap, aSnap] = await Promise.all([
        db.collection('users').get(),
        db.collection('cards').get(),
        db.collection('admins').get(),
      ]);

      const totalTaps = cSnap.docs.reduce((acc, doc) => acc + (doc.data().stats?.totalTaps || 0), 0);
      return res.json({
        totalUsers: uSnap.size,
        totalCards: cSnap.size,
        totalTaps,
        totalAdmins: aSnap.size,
      });
    }

    let totalTaps = 0;
    for (const card of inMemoryCards.values()) {
      totalTaps += card.stats?.totalTaps || 0;
    }

    res.json({
      totalUsers: inMemoryUsers.size,
      totalCards: inMemoryCards.size,
      totalTaps,
      totalAdmins: inMemoryAdmins.size,
    });
  } catch (err: any) {
    console.warn('Admin stats notice:', err?.message || err);
    res.json({ totalUsers: inMemoryUsers.size, totalCards: inMemoryCards.size, totalTaps: 0, totalAdmins: inMemoryAdmins.size });
  }
});

// Admin Get Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const db = getFirestoreDb();
    if (db) {
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

      if (result.length > 0) return res.json(result);
    }

    const memoryResult = Array.from(inMemoryUsers.values()).map(u => ({
      ...u,
      card: u.cardId ? inMemoryCards.get(u.cardId) || null : null,
      currentPassword: u.password || 'user123',
    }));

    res.json(memoryResult);
  } catch (err: any) {
    console.warn('Admin get users notice:', err?.message || err);
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

    // Store in memory
    inMemoryCards.set(newCardId, newCard);
    inMemoryUsers.set(newUserId, newUser);

    const db = getFirestoreDb();
    if (db) {
      await Promise.all([
        db.collection('cards').doc(newCardId).set(newCard),
        db.collection('users').doc(newUserId).set(newUser),
      ]);
    }

    res.status(201).json({ success: true, user: newUser, card: newCard });
  } catch (err: any) {
    console.error('User creation failed:', err?.message || err);
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
    if (db) {
      const uRef = db.collection('users').doc(userId);
      const uDoc = await uRef.get();
      if (uDoc.exists) {
        const updates: any = {};
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (password) updates.password = password;
        await uRef.update(updates);

        const cardId = uDoc.data()!.cardId;
        if (cardId && cardData) {
          await db.collection('cards').doc(cardId).set(cardData, { merge: true });
        }
      }
    }

    const memoryUser = inMemoryUsers.get(userId);
    if (memoryUser) {
      if (username) memoryUser.username = username;
      if (email) memoryUser.email = email;
      if (password) memoryUser.password = password;
      if (memoryUser.cardId && cardData) {
        const card = inMemoryCards.get(memoryUser.cardId);
        if (card) {
          inMemoryCards.set(memoryUser.cardId, { ...card, ...cardData });
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Update user failed:', err?.message || err);
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
    if (db) {
      await db.collection('users').doc(userId).update({ password: newPassword });
    }

    const memoryUser = inMemoryUsers.get(userId);
    if (memoryUser) {
      memoryUser.password = newPassword;
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Password update failed:', err?.message || err);
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

    if (db) {
      const uDoc = await db.collection('users').doc(userId).get();
      if (uDoc.exists) {
        const cId = uDoc.data()!.cardId;
        await Promise.all([
          db.collection('users').doc(userId).delete(),
          cId ? db.collection('cards').doc(cId).delete() : Promise.resolve(),
        ]);
      }
    }

    const memoryUser = inMemoryUsers.get(userId);
    if (memoryUser) {
      if (memoryUser.cardId) inMemoryCards.delete(memoryUser.cardId);
      inMemoryUsers.delete(userId);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('User deletion failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin Team Get
app.get('/api/admin/admins', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const db = getFirestoreDb();
    if (db) {
      const aSnap = await db.collection('admins').get();
      const result = aSnap.docs.map(d => {
        const a = d.data();
        return {
          ...a,
          currentPassword: a.password || 'admin123',
        };
      });
      if (result.length > 0) return res.json(result);
    }

    const memoryResult = Array.from(inMemoryAdmins.values()).map(a => ({
      ...a,
      currentPassword: a.password || 'admin123',
    }));

    res.json(memoryResult);
  } catch (err: any) {
    console.warn('Admin fetch notice:', err?.message || err);
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

    inMemoryAdmins.set(newAdminId, newAdmin);

    const db = getFirestoreDb();
    if (db) {
      await db.collection('admins').doc(newAdminId).set(newAdmin);
    }

    res.status(201).json({ success: true, admin: newAdmin });
  } catch (err: any) {
    console.error('Admin creation failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Admin Team Delete
app.delete('/api/admin/admins/:adminId', async (req, res) => {
  try {
    const auth = parseAuthToken(req);
    if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { adminId } = req.params;
    inMemoryAdmins.delete(adminId);

    const db = getFirestoreDb();
    if (db) {
      await db.collection('admins').doc(adminId).delete();
    }

    res.json({ success: true, message: 'Admin deleted' });
  } catch (err: any) {
    console.error('Admin deletion failed:', err?.message || err);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ==================== AI ROUTES (GEMINI & GROQ) ====================

// AI Magic Fill: Extract structured details from raw bio text
app.post('/api/parse-bio', async (req, res) => {
  try {
    const { userText } = req.body;
    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      return res.status(400).json({ error: 'userText is required' });
    }

    const groq = getGroqClient();
    const gemini = getGeminiClient();

    if (!groq && !gemini) {
      return res.status(503).json({
        error: 'AI is not configured. Please set the GROQ_API_KEY or GEMINI_API_KEY environment variable.',
      });
    }

    const systemPrompt = `You are an expert bio information extractor. Extract user details from the text into a clean JSON object containing: name, title, bio, email, phone, whatsapp, facebook, linkedin, instagram, twitter, youtube, github, website.
Extract the most accurate and complete value for each key from the provided text. For phone/whatsapp numbers, keep international format if present. For social platforms, extract either the profile URL or handle.
If a field is not found in the input text, set its value to null or an empty string "".
Ensure the output is strictly valid JSON matching the required schema.`;

    let parsedObject: any = {};

    if (groq) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        temperature: 0.1,
      });

      const rawContent = completion.choices[0]?.message?.content?.trim() || '{}';
      try {
        parsedObject = JSON.parse(rawContent);
      } catch (e) {
        console.error('Failed to parse Groq response as JSON:', rawContent);
        parsedObject = {};
      }
    } else if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nUser input text to extract from:\n${userText}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawContent = response.text?.trim() || '{}';
      try {
        parsedObject = JSON.parse(rawContent);
      } catch (e) {
        console.error('Failed to parse Gemini response as JSON:', rawContent);
        parsedObject = {};
      }
    }

    return res.json({ success: true, data: parsedObject });
  } catch (err: any) {
    console.error('Parse bio error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to parse bio text' });
  }
});

// Generate Professional Bio
app.post('/api/ai/generate-bio', async (req, res) => {
  try {
    const { fullName, jobTitle, company, tone = 'professional', keywords = '', existingBio = '' } = req.body;

    const gemini = getGeminiClient();
    const groq = getGroqClient();

    if (!gemini && !groq) {
      return res.status(503).json({
        error: 'AI is not configured. Please set the GEMINI_API_KEY or GROQ_API_KEY environment variable.',
      });
    }

    const systemPrompt = `You are an elite digital business card copywriter and personal branding expert for Zyro Cards. Your task is to write a concise, compelling bio (max 2-3 sentences, 40-70 words) for a professional NFC digital card profile.
Tone: ${tone}.
Return ONLY the raw bio text with no quotes, markdown formatting, or introductory commentary.`;

    const userPrompt = `Name: ${fullName || 'Professional'}
Job Title: ${jobTitle || 'Expert'}
Company: ${company || ''}
Key Skills/Keywords: ${keywords || 'None provided'}
Existing Bio context: ${existingBio || 'None'}`;

    if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`,
      });
      const bio = response.text?.trim() || '';
      return res.json({ success: true, bio });
    }

    if (groq) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 250,
      });

      const bio = completion.choices[0]?.message?.content?.trim() || '';
      return res.json({ success: true, bio });
    }
  } catch (err: any) {
    console.error('Bio generation error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to generate bio' });
  }
});

// Suggest Social Links & Action Buttons
app.post('/api/ai/suggest-links', async (req, res) => {
  try {
    const { fullName, jobTitle, company, bio } = req.body;

    const gemini = getGeminiClient();
    const groq = getGroqClient();

    if (!gemini && !groq) {
      return res.status(503).json({
        error: 'AI is not configured. Please set the GEMINI_API_KEY or GROQ_API_KEY environment variable.',
      });
    }

    const systemPrompt = `You are a digital card optimization assistant. Suggest 3 to 5 high-converting social links and calls-to-action for a digital business card. Return a valid JSON array strictly matching this format:
[
  {
    "platform": "whatsapp" | "linkedin" | "website" | "instagram" | "twitter" | "youtube" | "github" | "custom",
    "title": "Short Title (e.g. Schedule a Meeting / Portfolio / Connect)",
    "subtitle": "Short benefit subtitle (max 5 words)"
  }
]
Output JSON array ONLY without markdown blocks or explanation.`;

    const userPrompt = `Professional Details:
Name: ${fullName || 'Professional'}
Job Title: ${jobTitle || 'Specialist'}
Company: ${company || 'Independent'}
Bio: ${bio || ''}`;

    let raw = '[]';
    if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`,
      });
      raw = response.text?.trim() || '[]';
    } else if (groq) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 400,
      });
      raw = completion.choices[0]?.message?.content?.trim() || '[]';
    }

    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let suggestions = [];
    try {
      const parsed = JSON.parse(raw);
      suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || parsed.links || []);
    } catch {
      suggestions = [];
    }

    res.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('Link suggestion error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to suggest links' });
  }
});

// AI Assistant & Chat for NFC Cards / Networking
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const gemini = getGeminiClient();
    const groq = getGroqClient();

    if (!gemini && !groq) {
      return res.status(503).json({
        error: 'AI is not configured. Please set the GEMINI_API_KEY or GROQ_API_KEY environment variable.',
      });
    }

    const systemPrompt = `You are Zyro AI, the intelligent assistant for Zyro Cards (the NFC Smart Digital Business Card platform). You help entrepreneurs, sales professionals, and admins optimize their NFC cards, write elevator pitches, learn how to program NTAG215/216 chips, and grow their networking efficiency. Be concise, actionable, and friendly.`;

    if (gemini) {
      const promptParts = [
        systemPrompt,
        ...history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content || ''}`),
        `User: ${message}`,
      ].join('\n\n');

      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptParts,
      });

      const reply = response.text?.trim() || '';
      return res.json({ success: true, reply });
    }

    if (groq) {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: String(h.content || ''),
        })),
        { role: 'user', content: String(message) },
      ];

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 600,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || '';
      return res.json({ success: true, reply });
    }
  } catch (err: any) {
    console.error('AI chat error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'AI request failed' });
  }
});

// Generate Custom Copy & Taglines
app.post('/api/ai/generate-copy', async (req, res) => {
  try {
    const { prompt, type = 'tagline' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const gemini = getGeminiClient();
    const groq = getGroqClient();

    if (!gemini && !groq) {
      return res.status(503).json({
        error: 'AI is not configured. Please set the GEMINI_API_KEY or GROQ_API_KEY environment variable.',
      });
    }

    const systemInstruction = `You are an expert copywriter for digital business cards. Write concise, punchy copy (${type}). Output ONLY the text.`;

    if (gemini) {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemInstruction}\n\n${prompt}`,
      });
      const result = response.text?.trim() || '';
      return res.json({ success: true, result });
    }

    if (groq) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemInstruction,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const result = completion.choices[0]?.message?.content?.trim() || '';
      return res.json({ success: true, result });
    }
  } catch (err: any) {
    console.error('Copy generation error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to generate copy' });
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
    console.log(`Zyro Cards server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
