import React, { useState } from 'react';
import { CardProfile, SocialLink } from '../types';
import { PRESET_THEMES } from '../data/mockData';
import { DigitalCardView } from './DigitalCardView';
import QRCode from 'qrcode';
import { 
  User, 
  Link as LinkIcon, 
  Palette, 
  QrCode, 
  BarChart3, 
  Key, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Check, 
  Download, 
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Sun,
  Moon
} from 'lucide-react';

interface Props {
  card: CardProfile;
  authToken: string;
  onUpdateCard: (updated: CardProfile) => void;
  appTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const UserDashboard: React.FC<Props> = ({ 
  card, 
  authToken, 
  onUpdateCard,
  appTheme = 'dark',
  onToggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'contacts' | 'links' | 'theme' | 'analytics' | 'security'>('profile');
  const [cardData, setCardData] = useState<CardProfile>(card);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [copiedNfcLink, setCopiedNfcLink] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ url: string; qrCode: string } | null>(null);

  const isDark = appTheme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200/80 text-slate-900 shadow-sm';
  const inputClass = isDark 
    ? 'w-full px-3.5 py-2.5 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 font-medium'
    : 'w-full px-3.5 py-2.5 bg-slate-50 text-slate-900 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 font-medium';
  const labelClass = isDark ? 'block text-xs font-bold text-slate-200 mb-1.5' : 'block text-xs font-bold text-slate-800 mb-1.5';
  const headingClass = isDark ? 'text-lg font-extrabold text-white border-b border-slate-800 pb-3' : 'text-lg font-extrabold text-slate-900 border-b border-slate-200 pb-3';

  // Security tab state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New social link state
  const [newPlatform, setNewPlatform] = useState<SocialLink['platform']>('facebook');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(cardData),
      });

      const data = await res.json();
      if (res.ok && data.card) {
        onUpdateCard(data.card);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPassMsg({ type: 'success', text: 'Password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
      } else {
        setPassMsg({ type: 'error', text: data.error || 'Password update failed' });
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: 'Server error updating password' });
    }
  };

  const handleAddLink = () => {
    if (!newTitle || !newUrl) {
      alert('Please fill in title and URL');
      return;
    }

    const newLink: SocialLink = {
      id: 'l-' + Date.now(),
      platform: newPlatform,
      title: newTitle,
      subtitle: newSubtitle || `Follow on ${newPlatform}`,
      url: newUrl,
      active: true,
    };

    setCardData({
      ...cardData,
      links: [...cardData.links, newLink],
    });

    setNewTitle('');
    setNewSubtitle('');
    setNewUrl('');
  };

  const handleDeleteLink = (id: string) => {
    setCardData({
      ...cardData,
      links: cardData.links.filter(l => l.id !== id),
    });
  };

  const handleToggleLinkActive = (id: string) => {
    setCardData({
      ...cardData,
      links: cardData.links.map(l => l.id === id ? { ...l, active: !l.active } : l),
    });
  };

  const handleCopyNfcUrl = () => {
    const fullUrl = `${window.location.origin}/c/${cardData.username}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedNfcLink(true);
    setTimeout(() => setCopiedNfcLink(false), 2500);
  };

  const handleOpenUserQrModal = async () => {
    const fullUrl = `${window.location.origin}/c/${cardData.username}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(fullUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrModalData({ url: fullUrl, qrCode: qrDataUrl });
    } catch (err) {
      console.error('Failed to generate user QR code', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner & Quick Status */}
      <div className={`${cardBg} rounded-3xl p-6 border mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            Active Card URL: {`${window.location.origin}/c/${cardData.username}`}
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User Dashboard</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Customize your NFC digital business card profile, links, themes & contacts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyNfcUrl}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              copiedNfcLink
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Copy exact NFC URL to program into your physical card"
          >
            {copiedNfcLink ? <Check className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            <span>{copiedNfcLink ? 'Copied NFC URL!' : 'Copy NFC Link'}</span>
          </button>

          <button
            onClick={handleOpenUserQrModal}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              isDark
                ? 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-500" />
            <span>My QR Code</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                isDark 
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-100 text-indigo-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          )}

          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
          </button>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* USER QR CODE MODAL */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`${cardBg} max-w-sm w-full p-6 rounded-3xl border shadow-2xl text-center space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <h3 className={`font-extrabold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <QrCode className="w-5 h-5 text-indigo-500" />
                <span>Your Card QR Code</span>
              </h3>
              <button
                onClick={() => setQrModalData(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              <img src={qrModalData.qrCode} alt="User Card QR Code" className="w-56 h-56 mx-auto" />
            </div>

            <p className="font-mono text-xs text-blue-400 break-all bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              {qrModalData.url}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrModalData.url);
                  setCopiedNfcLink(true);
                  setTimeout(() => setCopiedNfcLink(false), 2000);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{copiedNfcLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <a
                href={qrModalData.qrCode}
                download={`${cardData.username}_qrcode.png`}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className={`${cardBg} rounded-2xl p-2 border space-y-1`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Basic Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${
                activeTab === 'contacts' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Quick Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${
                activeTab === 'links' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Social Links ({cardData.links.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${
                activeTab === 'theme' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Styling</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tap Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${
                activeTab === 'security' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        {/* Form Body Container */}
        <div className={`space-y-6 ${showLivePreview ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
          
          {/* TAB 1: BASIC PROFILE */}
          {activeTab === 'profile' && (
            <div className={`${cardBg} rounded-3xl p-6 border space-y-5`}>
              <h2 className={headingClass}>
                Basic Profile Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    value={cardData.fullName}
                    onChange={e => setCardData({ ...cardData, fullName: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Joshua B."
                  />
                </div>

                <div>
                  <label className={labelClass}>Job Title</label>
                  <input
                    type="text"
                    value={cardData.jobTitle}
                    onChange={e => setCardData({ ...cardData, jobTitle: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Sales Manager"
                  />
                </div>

                <div>
                  <label className={labelClass}>Company / Business</label>
                  <input
                    type="text"
                    value={cardData.company || ''}
                    onChange={e => setCardData({ ...cardData, company: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Nexus Tech"
                  />
                </div>

                <div>
                  <label className={labelClass}>Card URL Slug</label>
                  <input
                    type="text"
                    value={cardData.username}
                    readOnly
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm cursor-not-allowed ${
                      isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Slug is managed by admin</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Bio / Brief Intro</label>
                <textarea
                  rows={3}
                  value={cardData.bio || ''}
                  onChange={e => setCardData({ ...cardData, bio: e.target.value })}
                  className={inputClass}
                  placeholder="Describe what you do or your slogan..."
                />
              </div>

              <div>
                <label className={labelClass}>Profile Avatar Picture URL</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={cardData.avatarUrl}
                    onChange={e => setCardData({ ...cardData, avatarUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                  <div className="w-10 h-10 rounded-full overflow-hidden border shrink-0 bg-slate-100">
                    <img src={cardData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Or Choose Preset Avatar</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
                  ].map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCardData({ ...cardData, avatarUrl: url })}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        cardData.avatarUrl === url ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK CONTACTS */}
          {activeTab === 'contacts' && (
            <div className={`${cardBg} rounded-3xl p-6 border space-y-5`}>
              <h2 className={headingClass}>
                Quick Action Buttons
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                These circular quick buttons appear right below your profile header for 1-tap calling, mailing, or WhatsApp chatting.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <Phone className="w-3.5 h-3.5 text-blue-500" /> Phone Call Number
                  </label>
                  <input
                    type="text"
                    value={cardData.quickActions.phone || ''}
                    onChange={e => setCardData({
                      ...cardData,
                      quickActions: { ...cardData.quickActions, phone: e.target.value }
                    })}
                    className={inputClass}
                    placeholder="+8801700000000"
                  />
                </div>

                <div>
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={cardData.quickActions.email || ''}
                    onChange={e => setCardData({
                      ...cardData,
                      quickActions: { ...cardData.quickActions, email: e.target.value }
                    })}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> SMS Number
                  </label>
                  <input
                    type="text"
                    value={cardData.quickActions.sms || ''}
                    onChange={e => setCardData({
                      ...cardData,
                      quickActions: { ...cardData.quickActions, sms: e.target.value }
                    })}
                    className={inputClass}
                    placeholder="+8801700000000"
                  />
                </div>

                <div>
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Number (Include country code without +)
                  </label>
                  <input
                    type="text"
                    value={cardData.quickActions.whatsapp || ''}
                    onChange={e => setCardData({
                      ...cardData,
                      quickActions: { ...cardData.quickActions, whatsapp: e.target.value }
                    })}
                    className={inputClass}
                    placeholder="8801700000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Add Link Form */}
              <div className={`${cardBg} rounded-3xl p-6 border space-y-4`}>
                <h2 className={headingClass}>
                  Add Social / Web Link
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Platform</label>
                    <select
                      value={newPlatform}
                      onChange={e => setNewPlatform(e.target.value as any)}
                      className={inputClass}
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="whatsapp">WhatsApp Direct</option>
                      <option value="telegram">Telegram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="website">Website</option>
                      <option value="custom">Custom Link</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Link Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Facebook Page"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Subtitle / Hint</label>
                    <input
                      type="text"
                      value={newSubtitle}
                      onChange={e => setNewSubtitle(e.target.value)}
                      placeholder="e.g. Follow us on Facebook"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Destination URL</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Link to Card</span>
                </button>
              </div>

              {/* Existing Links List */}
              <div className={`${cardBg} rounded-3xl p-6 border space-y-4`}>
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Active Links on Card ({cardData.links.length})
                </h3>

                <div className="space-y-3">
                  {cardData.links.map((link, index) => (
                    <div
                      key={link.id}
                      className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 ${
                        isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{link.title}</p>
                          <p className={`text-xs truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{link.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleLinkActive(link.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            link.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {link.active ? 'Enabled' : 'Hidden'}
                        </button>

                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50/20 rounded-xl transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THEME & STYLING */}
          {activeTab === 'theme' && (
            <div className={`${cardBg} rounded-3xl p-6 border space-y-6`}>
              <h2 className={headingClass}>
                Theme & Aesthetic Customization
              </h2>

              {/* Interface Dark / Light Mode Switcher */}
              {onToggleTheme && (
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <label className={labelClass}>App Interface Mode</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { if (isDark) onToggleTheme(); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        !isDark ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light Interface</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { if (!isDark) onToggleTheme(); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        isDark ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark Interface</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Choose Preset Card Design Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {PRESET_THEMES.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => setCardData({ ...cardData, theme })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        cardData.theme.id === theme.id 
                          ? 'border-blue-600 bg-blue-50/20 shadow-sm' 
                          : isDark ? 'border-slate-700 hover:border-slate-600 bg-slate-800/40' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full shadow border" 
                          style={{ backgroundColor: theme.backgroundColor }} 
                        />
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{theme.name}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Style: {theme.backgroundStyle}</p>
                        </div>
                      </div>

                      {cardData.theme.id === theme.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Custom Background Image Overlay URL</label>
                <input
                  type="text"
                  value={cardData.theme.backgroundImageUrl || ''}
                  onChange={e => setCardData({
                    ...cardData,
                    theme: { ...cardData.theme, backgroundImageUrl: e.target.value }
                  })}
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className={`${cardBg} rounded-3xl p-6 border space-y-6`}>
              <h2 className={headingClass}>
                Tap & Link Click Analytics
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Total Card Taps</p>
                  <p className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>{cardData.stats.totalTaps || 0}</p>
                </div>

                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Last Tapped At</p>
                  <p className={`text-sm font-semibold mt-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {cardData.stats.lastTappedAt ? new Date(cardData.stats.lastTappedAt).toLocaleString() : 'No taps recorded yet'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className={`font-bold text-sm mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Link Clicks Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(cardData.stats.linkClicks || {}).map(([key, val]) => (
                    <div key={key} className={`flex items-center justify-between p-3 rounded-xl text-sm border ${
                      isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`font-medium capitalize ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{key}</span>
                      <span className="font-bold text-blue-500 bg-blue-500/20 px-2.5 py-0.5 rounded-full text-xs">
                        {val} clicks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY */}
          {activeTab === 'security' && (
            <div className={`${cardBg} rounded-3xl p-6 border space-y-5`}>
              <h2 className={headingClass}>
                Change Password
              </h2>

              {passMsg && (
                <div className={`p-3.5 rounded-xl text-xs font-medium ${
                  passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {passMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={4}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Optional Right Column Live Preview */}
        {showLivePreview && (
          <div className="lg:col-span-4 sticky top-6">
            <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/60 border-slate-200'}`}>
              <DigitalCardView card={cardData} isPreview={true} showDeviceFrameDefault={true} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
