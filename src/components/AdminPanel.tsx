import React, { useState, useEffect } from 'react';
import { CardProfile, UserAccount, AdminAccount } from '../types';
import { PRESET_THEMES } from '../data/mockData';
import { DigitalCardView } from './DigitalCardView';
import QRCode from 'qrcode';
import { 
  Users, 
  ShieldAlert, 
  Plus, 
  Search, 
  Edit3, 
  Key, 
  Trash2, 
  Eye, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  Copy, 
  Download, 
  X,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Lock,
  Layers,
  HelpCircle,
  ExternalLink,
  Smartphone,
  BarChart3,
  RefreshCw,
  Sun,
  Moon,
  QrCode,
  Radio
} from 'lucide-react';

interface Props {
  authToken: string;
  appTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onProfilesChange?: () => void;
  onCardCreated?: (card: CardProfile) => void;
  activeFrontCardId?: string;
  onSetFrontPreviewCard?: (cardId: string) => void;
  onUpdateCardProfile?: (card: CardProfile) => Promise<void> | void;
}

export const AdminPanel: React.FC<Props> = ({ 
  authToken,
  appTheme = 'dark',
  onToggleTheme,
  onProfilesChange,
  onCardCreated,
  activeFrontCardId = 'card-joshua',
  onSetFrontPreviewCard,
  onUpdateCardProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'preview' | 'admins' | 'guide'>('users');
  const [users, setUsers] = useState<Array<UserAccount & { card?: CardProfile; currentPassword?: string }>>([]);
  const [admins, setAdmins] = useState<Array<AdminAccount & { currentPassword?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Front Preview Card Editor local state
  const [selectedPreviewCardId, setSelectedPreviewCardId] = useState<string>('');
  const [previewEditingCard, setPreviewEditingCard] = useState<CardProfile | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSavingFrontCard, setIsSavingFrontCard] = useState(false);

  const isDark = appTheme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200/80 text-slate-900 shadow-sm';
  const inputClass = isDark 
    ? 'w-full px-3.5 py-2.5 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500'
    : 'w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400';
  const labelClass = isDark ? 'block text-xs font-semibold text-slate-300 mb-1' : 'block text-xs font-semibold text-slate-600 mb-1';
  const modalBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  // Modals state
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [previewCardModalOpen, setPreviewCardModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrUser, setSelectedQrUser] = useState<(UserAccount & { card?: CardProfile }) | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const handleOpenQrModal = async (user: UserAccount & { card?: CardProfile }) => {
    setSelectedQrUser(user);
    const cardUrl = `${window.location.origin}/c/${user.username}`;
    try {
      const url = await QRCode.toDataURL(cardUrl, { width: 800, margin: 2 });
      setQrDataUrl(url);
      setQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  };

  // Admin Team modal state
  const [newAdminModalOpen, setNewAdminModalOpen] = useState(false);
  const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);

  // Selected entities for modals
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  // Form states for New User
  const [numFullName, setNumFullName] = useState('');
  const [numUsername, setNumUsername] = useState('');
  const [numEmail, setNumEmail] = useState('');
  const [numPhone, setNumPhone] = useState('');
  const [numPassword, setNumPassword] = useState('');
  const [numCompany, setNumCompany] = useState('');
  const [numJobTitle, setNumJobTitle] = useState('');

  // Form state for Editing User Card Details
  const [editFullName, setEditFullName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Form states for Admin Team
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const [editAdminUsername, setEditAdminUsername] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedNfcLink, setCopiedNfcLink] = useState<string | null>(null);

  // Keep front preview editing card in sync
  useEffect(() => {
    const targetId = selectedPreviewCardId || activeFrontCardId;
    const foundUser = users.find(u => u.card?.id === targetId || u.cardId === targetId);
    if (foundUser?.card) {
      setPreviewEditingCard(foundUser.card);
      if (!selectedPreviewCardId) setSelectedPreviewCardId(foundUser.card.id);
    } else if (users[0]?.card) {
      setPreviewEditingCard(users[0].card);
      if (!selectedPreviewCardId) setSelectedPreviewCardId(users[0].card.id);
    }
  }, [selectedPreviewCardId, activeFrontCardId, users]);

  const handleSaveFrontPreviewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewEditingCard) return;

    setIsSavingFrontCard(true);
    setSaveSuccessMsg('');

    try {
      if (onUpdateCardProfile) {
        await onUpdateCardProfile(previewEditingCard);
      }
      if (onSetFrontPreviewCard) {
        onSetFrontPreviewCard(previewEditingCard.id);
      }
      setSaveSuccessMsg('Front-Page Preview Card updated & set active successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      console.error('Failed to save front preview card', err);
    } finally {
      setIsSavingFrontCard(false);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAdmins(aData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authToken]);

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fullName: numFullName,
          username: numUsername,
          email: numEmail,
          phone: numPhone,
          password: numPassword,
          company: numCompany,
          jobTitle: numJobTitle,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('User Account & Card created successfully!');
        setNewUserModalOpen(false);
        setNumFullName('');
        setNumUsername('');
        setNumEmail('');
        setNumPhone('');
        setNumPassword('');
        setNumCompany('');
        setNumJobTitle('');
        fetchData();
        if (data.card && onCardCreated) onCardCreated(data.card);
        if (onProfilesChange) onProfilesChange();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Error creating user');
    }
  };

  // Edit User Handler
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: editEmail,
          password: editPassword,
          cardData: {
            fullName: editFullName,
            jobTitle: editJobTitle,
            company: editCompany,
            bio: editBio,
            avatarUrl: editAvatarUrl,
            quickActions: {
              ...selectedUser.card?.quickActions,
              phone: editPhone,
              email: editEmail,
              sms: editPhone,
              whatsapp: editPhone ? editPhone.replace(/[^0-9]/g, '') : '',
            },
          },
        }),
      });

      if (res.ok) {
        alert('User profile updated successfully by Admin!');
        setEditUserModalOpen(false);
        fetchData();
        if (onProfilesChange) onProfilesChange();
      } else {
        const d = await res.json();
        alert(d.error || 'Update failed');
      }
    } catch (err) {
      alert('Error saving user edit');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user account @${username}? This action is permanent.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        fetchData();
        if (onProfilesChange) onProfilesChange();
      } else {
        alert('Failed to delete user');
      }
    } catch (e) {
      alert('Error deleting user');
    }
  };

  // Create Admin Handler
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username: newAdminUsername,
          email: newAdminEmail,
          password: newAdminPassword,
        }),
      });

      if (res.ok) {
        alert('New Admin added successfully!');
        setNewAdminModalOpen(false);
        setNewAdminUsername('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to add admin');
      }
    } catch (err) {
      alert('Error adding admin');
    }
  };

  // Edit Admin Handler
  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      const res = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username: editAdminUsername,
          email: editAdminEmail,
          password: editAdminPassword || undefined,
        }),
      });

      if (res.ok) {
        alert('Admin details updated successfully!');
        setEditAdminModalOpen(false);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Update failed');
      }
    } catch (e) {
      alert('Error updating admin');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.card?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTaps = users.reduce((acc, u) => acc + (u.card?.stats.totalTaps || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold mb-3 border border-blue-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Super Admin Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            NFC Business Admin Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer NFC profiles, issue credentials, customize designs, and manage team access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          )}

          <button
            onClick={() => setNewUserModalOpen(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User Card</span>
          </button>
        </div>
      </div>

      {/* Admin Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className={`${cardBg} p-5 rounded-2xl border`}>
          <div className="flex items-center justify-between text-xs font-medium mb-1 opacity-70">
            <span>Total NFC Cards</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{users.length}</p>
        </div>

        <div className={`${cardBg} p-5 rounded-2xl border`}>
          <div className="flex items-center justify-between text-xs font-medium mb-1 opacity-70">
            <span>Total Taps & Scans</span>
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalTaps}</p>
        </div>

        <div className={`${cardBg} p-5 rounded-2xl border`}>
          <div className="flex items-center justify-between text-xs font-medium mb-1 opacity-70">
            <span>Active Admins</span>
            <Lock className="w-4 h-4 text-purple-500" />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{admins.length}</p>
        </div>

        <div className={`${cardBg} p-5 rounded-2xl border`}>
          <div className="flex items-center justify-between text-xs font-medium mb-1 opacity-70">
            <span>System Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-emerald-500">100% Operational</p>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-700/50 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Cards ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'preview'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : isDark ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Front-Page Preview Card Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'admins'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Admin Team ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'guide'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>A-Z NFC Business Execution Guide (Bangla)</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className={`${cardBg} rounded-3xl border shadow-sm overflow-hidden`}>
          
          {/* Table Header & Search */}
          <div className={`p-5 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, name or slug..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              onClick={fetchData}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`uppercase text-[11px] font-bold tracking-wider border-b ${
                isDark ? 'bg-slate-800/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}>
                <tr>
                  <th className="py-3.5 px-6">User / Full Name</th>
                  <th className="py-3.5 px-6">Card Slug & QR Code</th>
                  <th className="py-3.5 px-6">NFC Write Link (URL)</th>
                  <th className="py-3.5 px-6">Login Password</th>
                  <th className="py-3.5 px-6 text-center">Taps</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                {filteredUsers.map(user => (
                  <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}`}>
                    
                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.card?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'}
                          alt={user.card?.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.card?.fullName || user.username}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Card Slug URL & QR Code Button */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg ${
                          isDark 
                            ? 'text-blue-400 bg-blue-950/60 border border-blue-900/50' 
                            : 'text-blue-600 bg-blue-50 border border-blue-100'
                        }`}>
                          <span>/c/{user.username}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/c/${user.username}`);
                              setCopiedSlug(user.username);
                              setTimeout(() => setCopiedSlug(null), 2000);
                            }}
                            className="hover:text-blue-800 dark:hover:text-blue-300"
                            title="Copy Slug URL"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedSlug === user.username && (
                            <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                          )}
                        </div>

                        {/* Direct QR Code Action Button */}
                        <button
                          onClick={() => handleOpenQrModal(user)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 active:scale-95 shadow-xs ${
                            isDark
                              ? 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                          }`}
                          title={`Generate & Download QR Code for ${user.username}`}
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                          <span>QR Code</span>
                        </button>
                      </div>
                    </td>

                    {/* Dedicated NFC Write Link Column for Easy Copying */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 rounded-xl border max-w-[220px] ${
                          isDark 
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-900/60' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{`${window.location.origin}/c/${user.username}`}</span>
                        </div>

                        <button
                          onClick={() => {
                            const fullNfcUrl = `${window.location.origin}/c/${user.username}`;
                            navigator.clipboard.writeText(fullNfcUrl);
                            setCopiedNfcLink(user.username);
                            setTimeout(() => setCopiedNfcLink(null), 2000);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 shadow-xs ${
                            copiedNfcLink === user.username
                              ? 'bg-emerald-600 text-white'
                              : isDark
                              ? 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/80'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                          }`}
                          title="Copy exact link to write onto physical NFC Tag using NFC Tools app"
                        >
                          {copiedNfcLink === user.username ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy NFC Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Password display for admin control */}
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md font-semibold text-slate-800">
                        {user.currentPassword}
                      </span>
                    </td>

                    {/* Tap count */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs">
                        {user.card?.stats.totalTaps || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Set as Front Preview Card */}
                        {user.card && (
                          <button
                            onClick={() => {
                              if (user.card) {
                                onSetFrontPreviewCard?.(user.card.id);
                                setSelectedPreviewCardId(user.card.id);
                                setPreviewEditingCard(user.card);
                                setActiveTab('preview');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border shrink-0 ${
                              activeFrontCardId === user.card.id
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                : isDark
                                ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                            title={activeFrontCardId === user.card.id ? 'Currently Active Front-Page Preview Card' : 'Set as Front-Page Live Preview Card'}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{activeFrontCardId === user.card.id ? 'Active Front' : 'Set Front'}</span>
                          </button>
                        )}

                        {/* View Live Card Modal */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setPreviewCardModalOpen(true);
                          }}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview Live Digital Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit User details */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditFullName(user.card?.fullName || '');
                            setEditJobTitle(user.card?.jobTitle || '');
                            setEditCompany(user.card?.company || '');
                            setEditBio(user.card?.bio || '');
                            setEditAvatarUrl(user.card?.avatarUrl || '');
                            setEditPhone(user.card?.quickActions.phone || '');
                            setEditEmail(user.email || '');
                            setEditPassword(user.currentPassword || '');
                            setEditUserModalOpen(true);
                          }}
                          className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Full Admin Edit Profile & Password"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: FRONT-PAGE PREVIEW CARD LIVE EDITOR */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className={`${cardBg} p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
                isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Home Screen Live Preview Control</span>
              </div>
              <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Front-Page Preview Card Settings & Live Editor
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Select which customer NFC card profile is featured on the main landing preview, and edit its name, photo, bio, or links directly in real time!
              </p>
            </div>

            {/* Quick Card Switcher Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-400 shrink-0">Featured Profile:</label>
              <select
                value={selectedPreviewCardId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedPreviewCardId(newId);
                  const foundUser = users.find(u => u.card?.id === newId || u.cardId === newId);
                  if (foundUser?.card) {
                    setPreviewEditingCard(foundUser.card);
                    if (onSetFrontPreviewCard) onSetFrontPreviewCard(foundUser.card.id);
                  }
                }}
                className={`px-3 py-2 border rounded-xl text-xs font-bold outline-none cursor-pointer ${
                  isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                }`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.card?.id || u.cardId}>
                    {u.card?.fullName || u.fullName} (@{u.username}) {u.card?.id === activeFrontCardId ? '★ Active Front' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-200 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {previewEditingCard ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Live Card Editor Form */}
              <div className={`lg:col-span-7 xl:col-span-7 ${cardBg} p-6 sm:p-8 rounded-3xl border shadow-xl`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Edit3 className="w-5 h-5 text-blue-500" />
                  <span>Edit Profile Details for Front-Page Preview</span>
                </h3>

                <form onSubmit={handleSaveFrontPreviewCard} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={previewEditingCard.fullName || ''}
                        onChange={(e) => setPreviewEditingCard({ ...previewEditingCard, fullName: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Job Title / Designation</label>
                      <input
                        type="text"
                        value={previewEditingCard.jobTitle || ''}
                        onChange={(e) => setPreviewEditingCard({ ...previewEditingCard, jobTitle: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Company / Organization</label>
                      <input
                        type="text"
                        value={previewEditingCard.company || ''}
                        onChange={(e) => setPreviewEditingCard({ ...previewEditingCard, company: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Profile Photo URL</label>
                      <input
                        type="text"
                        value={previewEditingCard.avatarUrl || ''}
                        onChange={(e) => setPreviewEditingCard({ ...previewEditingCard, avatarUrl: e.target.value })}
                        className={inputClass}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Card Bio / Intro Description</label>
                    <textarea
                      rows={2}
                      value={previewEditingCard.bio || ''}
                      onChange={(e) => setPreviewEditingCard({ ...previewEditingCard, bio: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Direct Phone Number</label>
                      <input
                        type="text"
                        value={previewEditingCard.quickActions?.phone || ''}
                        onChange={(e) =>
                          setPreviewEditingCard({
                            ...previewEditingCard,
                            quickActions: { ...previewEditingCard.quickActions, phone: e.target.value },
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>WhatsApp Number</label>
                      <input
                        type="text"
                        value={previewEditingCard.quickActions?.whatsapp || ''}
                        onChange={(e) =>
                          setPreviewEditingCard({
                            ...previewEditingCard,
                            quickActions: { ...previewEditingCard.quickActions, whatsapp: e.target.value },
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Card Theme Preset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                      {PRESET_THEMES.map((theme) => (
                        <button
                          type="button"
                          key={theme.id}
                          onClick={() => setPreviewEditingCard({ ...previewEditingCard, theme })}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                            previewEditingCard.theme?.id === theme.id
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400'
                              : isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className="truncate">{theme.name.split(' ')[0]}</span>
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSetFrontPreviewCard) {
                          onSetFrontPreviewCard(previewEditingCard.id);
                          setSaveSuccessMsg('Set as Front-Page Preview Card successfully!');
                          setTimeout(() => setSaveSuccessMsg(''), 3000);
                        }
                      }}
                      className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Set as Active Front Preview</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingFrontCard}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSavingFrontCard ? 'Saving Changes...' : 'Save & Set Front Preview'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Mobile Device Frame */}
              <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center lg:sticky lg:top-24">
                <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Real-Time Home Screen Live Device Preview</span>
                </div>

                <div className="w-full flex justify-center">
                  <DigitalCardView card={previewEditingCard} showDeviceFrameDefault={true} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Loading front page card editor...</div>
          )}
        </div>
      )}

      {/* TAB 2: ADMIN TEAM MANAGEMENT */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className={`${cardBg} p-5 rounded-3xl border flex justify-between items-center`}>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Team Members</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Admins have total management control over all customer cards and credentials.</p>
            </div>
            <button
              onClick={() => setNewAdminModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Admin</span>
            </button>
          </div>

          <div className={`${cardBg} rounded-3xl border overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead className={`${isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'} uppercase text-[11px] font-bold border-b`}>
                <tr>
                  <th className="py-3.5 px-6">Admin Username</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Password</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                {admins.map(admin => (
                  <tr key={admin.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}>
                    <td className={`py-4 px-6 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>@{admin.username}</td>
                    <td className={`py-4 px-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{admin.email}</td>
                    <td className="py-4 px-6 font-mono text-xs">
                      <span className={`px-2.5 py-1 rounded font-semibold ${isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800'}`}>
                        {admin.currentPassword}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 rounded-full text-xs font-semibold uppercase">
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setEditAdminUsername(admin.username);
                          setEditAdminEmail(admin.email);
                          setEditAdminPassword(admin.currentPassword || '');
                          setEditAdminModalOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 border ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Admin</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: A-Z NFC BUSINESS EXECUTION GUIDE (BANGLA) */}
      {activeTab === 'guide' && (
        <div className={`${cardBg} rounded-3xl p-6 md:p-8 border space-y-8`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 border ${
              isDark 
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}>
              <Cpu className="w-3.5 h-3.5" />
              <span>Zyro Cards Business Execution Blueprint (A-to-Z Guide)</span>
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              NFC কার্ড বিজনেস শুরু করার সম্পূর্ণ রোডম্যাপ (A to Z Guide)
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              আপনার Zyro Cards সফটওয়্যার সম্পূর্ণ প্রস্তুত! এবার কার্ড প্রিন্টিং, NFC রাইটিং, এবং কাস্টমার ডেলিভারি দেওয়ার পূর্ণাঙ্গ নির্দেশিকা নিচে পড়ুন:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 1 */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">1</span>
                <span>NFC Blank Card কেনা (Hardware Setup)</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                • <strong>কোন্ চিপ কিনবেন:</strong> বাজারে <strong>NTAG215</strong> অথবা <strong>NTAG216</strong> PVC Blank Cards পাওয়া যায় (চাংক বা অনলাইন শপ যেমন Daraz, Alibaba, or Local Electronics wholesale market)।<br/>
                • NTAG215 চিপের ক্যাপাসিটি 504 Bytes যা সব ধরেনর Android ও iPhone এ ৯০%+ সাপোর্টেড।
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">2</span>
                <span>কার্ডে ডিজাইন ও QR Code প্রিন্ট করা</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                • <strong>কার্ড প্রিন্ট:</strong> Epson L805 / UV Flatbed Printer অথবা স্থানীয় যেকোনো PVC ID Card Printing Shop থেকে কার্ডের সামনে কোম্পানির লোগো/নাম এবং পেছনে QR Code প্রিন্ট করে নিবেন।<br/>
                • কার্ডের পেছনের QR Code টি কাস্টমারের কার্ড লিঙ্ক (<code className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-700 text-blue-300' : 'bg-slate-200 text-blue-700'}`}>yourdomain.com/c/username</code>) নির্দেশ করবে।
              </p>
            </div>

            {/* Step 3 */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">3</span>
                <span>NFC চিপে URL প্রোগ্রামিং (Writing)</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                • প্লে-স্টোর বা অ্যাপ-স্টোর থেকে একদম ফ্রী মোবাইল অ্যাপ <strong>"NFC Tools"</strong> ডাউনলোড করুন।<br/>
                • <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL / URI</strong> চয়ন করুন।<br/>
                • কাস্টমারের কার্ড URL বসান (যেমন: <code className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-700 text-blue-300' : 'bg-slate-200 text-blue-700'}`}>https://yourdomain.com/c/joshua</code>)।<br/>
                • এবার <strong>Write</strong> এ ক্লিক করে ফিজিক্যাল NFC কার্ডটির পেছনে মোবাইল স্পর্শ করলেই ২ সেকেন্ডে চিপে ইউআরএল লক হয়ে যাবে!
              </p>
            </div>

            {/* Step 4 */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">4</span>
                <span>Admin End & Customer Handover</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                • এডমিন প্যানেল থেকে <strong>"Create New User Card"</strong> বাটনে চাপ দিয়ে ইউজার অ্যাকাউন্ট খুলুন।<br/>
                • এডমিন ইচ্ছে করলে সরাসরি থিম, নাম, সামাজিক যোগাযোগ মাধ্যমের লিঙ্ক এডিট করে দিতে পারবেন।<br/>
                • কাস্টমারকে তাদের কার্ড ডেলিভারি করার সাথে আইডি ও পাসওয়ার্ড দিয়ে দিন যাতে তারা নিজেরা পরবর্তীতে যেকোনো সময় প্রোফাইল ফটো বা ফোন নাম্বার বদলাতে পারে।
              </p>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW USER CARD */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${modalBg} border rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setNewUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Customer Card</h3>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Create account credentials & assign NFC card slug.</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={numFullName}
                    onChange={e => {
                      setNumFullName(e.target.value);
                      if (!numUsername) {
                        setNumUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }
                    }}
                    placeholder="e.g. Joshua B."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Card Slug / Username *</label>
                  <input
                    type="text"
                    required
                    value={numUsername}
                    onChange={e => setNumUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="joshua"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Company Name</label>
                  <input
                    type="text"
                    value={numCompany}
                    onChange={e => setNumCompany(e.target.value)}
                    placeholder="e.g. Zyro Cards"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Job Title</label>
                  <input
                    type="text"
                    value={numJobTitle}
                    onChange={e => setNumJobTitle(e.target.value)}
                    placeholder="e.g. Sales Manager"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="text"
                    value={numPhone}
                    onChange={e => setNumPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={numEmail}
                    onChange={e => setNumEmail(e.target.value)}
                    placeholder="user@zyrocards.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Initial User Login Password *</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={numPassword}
                  onChange={e => setNumPassword(e.target.value)}
                  placeholder="e.g. user123"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-md"
                >
                  Create & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER DETAILS */}
      {editUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${modalBg} border rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setEditUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Override Edit User</h3>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Customize user profile & login credentials for @{selectedUser.username}.</p>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title</label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={e => setEditJobTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Company</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={e => setEditCompany(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Profile Photo URL</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={e => setEditAvatarUrl(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>User Password (Admin Override)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className={`${inputClass} font-mono ${isDark ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md"
                >
                  Save Admin Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW CARD LIVE */}
      {previewCardModalOpen && selectedUser?.card && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-md w-full relative shadow-2xl my-auto border border-slate-800">
            <button
              onClick={() => setPreviewCardModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white z-50 bg-white/10 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <DigitalCardView card={selectedUser.card} isPreview={true} showDeviceFrameDefault={true} />
          </div>
        </div>
      )}

      {/* MODAL: NEW ADMIN */}
      {newAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${modalBg} border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative`}>
            <button
              onClick={() => setNewAdminModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add New Admin</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New admin will have full control capabilities.</p>

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className={labelClass}>Admin Username *</label>
                <input
                  type="text"
                  required
                  value={newAdminUsername}
                  onChange={e => setNewAdminUsername(e.target.value)}
                  className={inputClass}
                  placeholder="admin2"
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className={inputClass}
                  placeholder="admin2@zyrocards.com"
                />
              </div>

              <div>
                <label className={labelClass}>Password *</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  className={`${inputClass} font-mono`}
                  placeholder="admin123"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewAdminModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADMIN */}
      {editAdminModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${modalBg} border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative`}>
            <button
              onClick={() => setEditAdminModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit Admin Account</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Change admin credentials for @{selectedAdmin.username}.</p>

            <form onSubmit={handleSaveEditAdmin} className="space-y-3">
              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  value={editAdminUsername}
                  onChange={e => setEditAdminUsername(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={editAdminEmail}
                  onChange={e => setEditAdminEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="text"
                  value={editAdminPassword}
                  onChange={e => setEditAdminPassword(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditAdminModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER CARD QR CODE */}
      {qrModalOpen && selectedQrUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-md w-full shadow-2xl relative border ${modalBg}`}>
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">User Card QR Code</h3>
                <p className="text-xs opacity-75">
                  {selectedQrUser.card?.fullName || selectedQrUser.username} (@{selectedQrUser.username})
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-inner mb-5">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code for ${selectedQrUser.username}`} 
                  className="w-56 h-56 mx-auto rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-56 h-56 mx-auto flex items-center justify-center text-slate-400 text-xs">
                  Generating QR Code...
                </div>
              )}
              <p className="text-xs font-mono text-blue-600 mt-3 font-semibold break-all bg-blue-50 py-1.5 px-3 rounded-xl border border-blue-100">
                {window.location.origin}/c/{selectedQrUser.username}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href={qrDataUrl}
                download={`${selectedQrUser.username}_nfc_qrcode.png`}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res PNG (Print Ready)</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/c/${selectedQrUser.username}`);
                    alert('NFC Card Link copied to clipboard!');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Card Link</span>
                </button>

                <a
                  href={`/c/${selectedQrUser.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors text-center border ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Profile</span>
                </a>
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                isDark ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-300' : 'bg-indigo-50/80 border-indigo-200/80 text-indigo-900'
              }`}>
                💡 <strong>NFC Card Writing Instruction:</strong> Copy this exact URL and program it into the user's NTAG215 / NTAG216 physical NFC chip or print this QR Code directly onto their plastic smart business card.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
