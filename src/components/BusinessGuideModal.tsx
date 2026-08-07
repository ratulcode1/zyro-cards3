import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Cpu,
  Printer,
  DollarSign,
  Globe,
  Layers,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'printing' | 'nfc' | 'pricing' | 'workflow'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                A-Z NFC + QR Smart Card Business Execution Blueprint
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded-full font-medium">
                  Complete Guide
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Step-by-step roadmap to launch, source hardware, print, program NFC chips, and monetize smart cards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto py-2">
          {[
            { id: 'overview', label: '1. Executive Overview', icon: Sparkles },
            { id: 'hardware', label: '2. Hardware & Cards', icon: Cpu },
            { id: 'printing', label: '3. Printing & QR', icon: Printer },
            { id: 'nfc', label: '4. Programming NFC', icon: Smartphone },
            { id: 'pricing', label: '5. Pricing & Profit', icon: DollarSign },
            { id: 'workflow', label: '6. Business Setup', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 text-sm leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <Zap className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 text-base mb-1">
                    How NFC + QR Smart Business Cards Work
                  </h3>
                  <p className="text-xs text-blue-800">
                    A Smart Business Card contains an embedded NTAG215/216 NFC chip inside PVC/Metal/Wood card material, plus a printed high-contrast QR code on the back. When tapped against any modern iPhone or Android phone, or scanned via QR code, it instantly opens the user's live digital profile without requiring any special app installation!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Instant Contact Share</h4>
                  <p className="text-xs text-slate-600">
                    One-click `.vcf` download instantly saves name, title, phone, email, photo, address & company directly into smartphone Contacts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Real-time Updates</h4>
                  <p className="text-xs text-slate-600">
                    If the client changes phone number or job title, they edit it online in their User Dashboard. The physical card never needs re-printing!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Lead Capture CRM</h4>
                  <p className="text-xs text-slate-600">
                    People who view the card can submit their name & phone to "Exchange Contact", saving warm leads into the user's dashboard.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Key Value Proposition for Clients</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Eco-friendly & Cost-Saving:</strong> Replaces thousands of paper business cards with 1 sleek physical card.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Dual Technology:</strong> NFC works with tap; QR code works as a backup for older smartphones.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Corporate Ready:</strong> Companies can buy bulk cards for 50+ employees and manage all credentials in 1 Admin Panel.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-base">Card Materials & Chip Selection</h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    Recommended NFC Chip Specs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-semibold text-slate-900">NTAG215 Chip (Most Popular)</p>
                      <p className="text-slate-500 mt-1">504 Bytes usable memory. Perfectly fits card URL redirect link. Cost ~$0.20 - $0.35/card.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-semibold text-slate-900">NTAG216 Chip (Extended Memory)</p>
                      <p className="text-slate-500 mt-1">888 Bytes usable memory. Supports longer custom URLs or multi-records. Cost ~$0.45 - $0.70/card.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    Card Substrates & Material Options
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">1. White PVC Cards (Standard)</span>
                        <p className="text-slate-500">CR80 30mil standard credit card size. Waterproof, printable on Inkjet/UV/Thermal printers.</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">Cost: ~$0.30</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">2. Matte Black PVC / Hybrid Metal Cards</span>
                        <p className="text-slate-500">Premium luxury feel with anti-fingerprint matte texture. Fits high-end executives.</p>
                      </div>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200">Cost: ~$0.80</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">3. Natural Bamboo / Walnut Wood Cards</span>
                        <p className="text-slate-500">Eco-friendly laser-engraved finish. High aesthetic appeal for luxury brands.</p>
                      </div>
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200">Cost: ~$1.20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'printing' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-base">Printing & QR Code Customization</h3>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <Printer className="w-4 h-4 text-indigo-600" />
                    How to Print Design on Cards
                  </h4>
                  <p className="text-slate-600">
                    <strong>Option A (In-House Low Cost):</strong> Epson L805 or L8050 Photo Printer + PVC Card Tray attachment. Prints edge-to-edge high resolution color graphics directly on PVC blank cards.
                  </p>
                  <p className="text-slate-600">
                    <strong>Option B (Commercial UV Printing):</strong> UV Flatbed printer or laser engraving (for metal & wood cards). Outstanding durability and scratch resistance.
                  </p>
                  <p className="text-slate-600">
                    <strong>Option C (Outsourcing):</strong> Partner with local smart card printing vendors or AliExpress suppliers who ship pre-printed custom cards in bulk.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    QR Code Best Practices
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Always print high contrast QR codes (e.g. Dark Navy/Black on White or Cream background).</li>
                    <li>Link the QR code to the dynamic profile URL: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">https://yourdomain.com/c/username</code></li>
                    <li>Ensure QR code vector resolution is crisp and at least 1.5 cm x 1.5 cm on the card back.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nfc' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-base">Programming NFC Chips</h3>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  How to Write NFC Card (3 Easy Steps)
                </h4>

                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">Step 1: Get Profile URL</p>
                    <p className="text-slate-500">In Admin Panel or User Dashboard, copy the card URL (e.g. <code>https://yourdomain.com/c/joshua</code>).</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">Step 2: Use App or Web NFC API</p>
                    <p className="text-slate-500">Download <strong>NFC Tools</strong> (Free on iOS/Android) or use our built-in <strong>Web NFC Writer</strong> directly in Chrome/Android browser.</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">Step 3: Tap & Write NDEF Record</p>
                    <p className="text-slate-500">Select "Add Record" &gt; "URL / URI" &gt; Paste profile link &gt; Tap physical card to write!</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 font-medium">
                  💡 <strong>Pro Tip:</strong> You can keep the NFC chip read/write editable or lock it (Read-Only) before delivering to customers. Because the URL redirects to your cloud database, even if the chip is locked, the customer can still update their phone/photo online anytime!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-base">Pricing Strategy & Profit Margins</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Retail B2C Card Sales</h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Card Blank & Printing Cost:</span>
                      <span className="font-semibold text-slate-900">$1.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Card Retail Price:</span>
                      <span className="font-bold text-emerald-600">$25.00</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                      <span>Gross Profit Per Card:</span>
                      <span className="text-emerald-700">$23.50 (94% Margin)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Corporate B2B Bulk Orders</h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>50 Cards Package Cost:</span>
                      <span className="font-semibold text-slate-900">$75 ($1.50/ea)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Corporate Price:</span>
                      <span className="font-bold text-blue-600">$750 ($15/ea)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                      <span>Net Order Profit:</span>
                      <span className="text-blue-700">$675.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2 text-xs text-indigo-900">
                <h4 className="font-bold text-sm text-indigo-900">Recurring Subscription Upsell (SaaS Model)</h4>
                <p>
                  In addition to physical card sales, charge customers <strong>$3 - $5/month</strong> or <strong>$30/year</strong> for premium features like Custom Domain Mapping, Lead Export to CSV, Advanced Analytics, and CRM Integrations.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-base">Step-by-Step Business Launch Checklist</h3>

              <div className="space-y-3 text-xs">
                {[
                  {
                    title: '1. Brand & Domain Setup',
                    desc: 'Buy a catch domain name (e.g. tapcard.me or nfcbiz.com). Deploy this web application on your domain.'
                  },
                  {
                    title: '2. Source Sample Hardware',
                    desc: 'Order 50-100 NTAG215 PVC cards & test printing / tapping with iOS and Android.'
                  },
                  {
                    title: '3. Create Demo Cards',
                    desc: 'Create sample profiles in Admin Panel (e.g., Doctor, Real Estate Agent, Corporate Sales Rep) to present live to clients.'
                  },
                  {
                    title: '4. Set Up Admin & User Accounts',
                    desc: 'Give clients their individual login username & password so they can edit their profile details without needing your help.'
                  },
                  {
                    title: '5. Launch Marketing Campaign',
                    desc: 'Post short video clips showing "Tap Card on Phone -> Contact Appears" on TikTok, Facebook Reels & Instagram.'
                  },
                ].map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{step.title}</p>
                      <p className="text-slate-600 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            NFC Smart Digital Business Card System • All Systems Ready
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
