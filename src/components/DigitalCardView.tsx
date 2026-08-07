import React, { useState, useEffect } from 'react';
import { CardProfile } from '../types';
import QRCode from 'qrcode';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  QrCode, 
  Share2, 
  UserPlus, 
  ChevronRight, 
  X, 
  Check, 
  Globe, 
  ExternalLink,
  Sparkles,
  Smartphone,
  Maximize2,
  Copy
} from 'lucide-react';

interface Props {
  card: CardProfile;
  isPreview?: boolean;
  onTapLink?: (platform: string) => void;
  showDeviceFrameDefault?: boolean;
}

export const DigitalCardView: React.FC<Props> = ({ 
  card, 
  isPreview = false, 
  onTapLink,
  showDeviceFrameDefault = false,
}) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showDeviceFrame, setShowDeviceFrame] = useState(showDeviceFrameDefault);

  if (!card) {
    return (
      <div className="w-full max-w-sm mx-auto p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
        <p className="font-semibold text-slate-300">No Digital Card Selected</p>
        <p className="text-xs mt-2 text-slate-500">Log in as admin to create new digital card profiles.</p>
      </div>
    );
  }

  const cardUrl = `${window.location.origin}/c/${card.username}`;

  useEffect(() => {
    QRCode.toDataURL(cardUrl, { width: 320, margin: 2 })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [cardUrl]);

  const handleQuickAction = (type: 'phone' | 'email' | 'sms' | 'whatsapp') => {
    if (onTapLink) onTapLink(type);
    const value = card.quickActions[type];
    if (!value) return;

    if (type === 'phone') window.location.href = `tel:${value}`;
    if (type === 'email') window.location.href = `mailto:${value}`;
    if (type === 'sms') window.location.href = `sms:${value}`;
    if (type === 'whatsapp') {
      const cleanNum = value.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNum}`, '_blank');
    }
  };

  const handleSocialLinkClick = (url: string, platform: string) => {
    if (onTapLink) onTapLink(platform);
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }
    window.open(finalUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.fullName,
          text: `${card.fullName} - ${card.jobTitle}`,
          url: cardUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadVCard = () => {
    if (onTapLink) onTapLink('vcard');
    window.location.href = `/api/cards/${card.username}/vcard`;
  };

  // Helper for rendering SVG social icons
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return (
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
        );
      case 'instagram':
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
        );
      case 'twitter':
        return (
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        );
      case 'linkedin':
        return (
          <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </div>
        );
      case 'youtube':
        return (
          <div className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
        );
    }
  };

  const theme = card.theme;

  const cardContent = (
    <div 
      className="relative min-h-[720px] w-full max-w-md mx-auto overflow-hidden shadow-2xl rounded-3xl sm:rounded-[36px] flex flex-col justify-between"
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundImageUrl ? `url(${theme.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative Top Canvas Banner */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-transparent pointer-events-none" />

      {/* Main Content Scrollable Box */}
      <div className="relative z-10 px-5 pt-10 pb-28 flex-1 flex flex-col items-center">
        
        {/* Profile Avatar with Crisp Border */}
        <div className="relative mb-4 group">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-200">
            <img 
              src={card.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'} 
              alt={card.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-md" title="Online" />
        </div>

        {/* User Info with Glassmorphic Contrast Backdrop for Crystal Clear Legibility */}
        <div className="text-center mb-6 px-3 w-full flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {card.fullName}
          </h1>

          {(card.jobTitle || card.company) && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold text-sky-200 shadow-md">
              <span>{card.jobTitle}</span>
              {card.company && <span className="opacity-80">• {card.company}</span>}
            </div>
          )}

          {card.bio && (
            <div className="mt-2.5 px-4 py-2.5 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl max-w-xs w-full text-center">
              <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {card.bio}
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Icons Row */}
        <div className="flex items-center justify-center gap-4 mb-7 w-full max-w-xs">
          {card.quickActions.phone && (
            <button
              onClick={() => handleQuickAction('phone')}
              className="w-12 h-12 rounded-full bg-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-blue-600 active:scale-95"
              title="Call Phone"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}

          {card.quickActions.email && (
            <button
              onClick={() => handleQuickAction('email')}
              className="w-12 h-12 rounded-full bg-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-blue-600 active:scale-95"
              title="Send Email"
            >
              <Mail className="w-5 h-5" />
            </button>
          )}

          {card.quickActions.sms && (
            <button
              onClick={() => handleQuickAction('sms')}
              className="w-12 h-12 rounded-full bg-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-blue-600 active:scale-95"
              title="Send SMS"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}

          {card.quickActions.whatsapp && (
            <button
              onClick={() => handleQuickAction('whatsapp')}
              className="w-12 h-12 rounded-full bg-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-emerald-600 active:scale-95"
              title="Chat on WhatsApp"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Social Links List Cards Container */}
        <div className="w-full space-y-3">
          {card.links.filter(l => l.active).map(link => (
            <button
              key={link.id}
              onClick={() => handleSocialLinkClick(link.url, link.platform)}
              className="w-full p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 hover:shadow-xl hover:bg-white transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 text-left">
                {getSocialIcon(link.platform)}
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </h2>
                  {link.subtitle && (
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {link.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Bar at Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-2 p-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white/50">
        
        {/* QR Code Button */}
        <button
          onClick={() => setQrModalOpen(true)}
          className="w-11 h-11 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors shrink-0 shadow-sm"
          title="Show QR Code"
        >
          <QrCode className="w-5 h-5" />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-11 h-11 rounded-full bg-sky-400 text-white flex items-center justify-center hover:bg-sky-500 transition-colors shrink-0 shadow-sm relative"
          title="Share Card"
        >
          <Share2 className="w-5 h-5" />
          {copied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow">
              Copied!
            </span>
          )}
        </button>

        {/* Add to Contact Pill Button */}
        <button
          onClick={handleDownloadVCard}
          className="flex-1 h-11 px-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add to Contact</span>
        </button>

        {/* Plus / Contact Button */}
        <button
          onClick={() => handleQuickAction('phone')}
          className="w-11 h-11 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors shrink-0 shadow-sm"
          title="Direct Call"
        >
          <span className="text-xl font-bold line-none">+</span>
        </button>
      </div>

      {/* QR Code Modal Popup */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              NFC & QR Code
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Scan to Save Contact
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Point phone camera at QR code if NFC tap is unavailable.
            </p>

            {qrDataUrl && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl inline-block shadow-inner mb-4">
                <img src={qrDataUrl} alt="NFC Profile QR Code" className="w-56 h-56 mx-auto" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-100 p-2.5 rounded-xl break-all mb-4">
              <span className="truncate">{cardUrl}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(cardUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1 hover:text-blue-600 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleDownloadVCard}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Download Contact (.VCF)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full py-4 px-2 sm:px-4">
      {/* Device Frame Toggle Header */}
      {!isPreview && (
        <div className="max-w-md mx-auto mb-3 flex items-center justify-between text-xs text-slate-500 bg-white/80 backdrop-blur p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>NFC Tap Live Preview</span>
          </div>
          <button
            onClick={() => setShowDeviceFrame(!showDeviceFrame)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 bg-blue-50 rounded-lg transition-colors"
          >
            {showDeviceFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{showDeviceFrame ? 'Full Width' : 'Phone Frame'}</span>
          </button>
        </div>
      )}

      {showDeviceFrame ? (
        <div className="flex justify-center my-2">
          {/* Mock Smartphone Outer Shell */}
          <div className="relative border-[10px] border-slate-900 rounded-[48px] shadow-2xl p-1 bg-slate-900 max-w-[390px] w-full">
            {/* Phone Speaker Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
            </div>
            {cardContent}
          </div>
        </div>
      ) : (
        cardContent
      )}
    </div>
  );
};
