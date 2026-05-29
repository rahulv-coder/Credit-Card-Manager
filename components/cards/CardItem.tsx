'use client';

import React from 'react';
import { Card as CardType } from '@/lib/types';

const BANK_ABBR: Record<string, string> = {
  'HDFC': 'HDFC',
  'ICICI': 'ICICI',
  'Axis': 'AXIS',
  'SBI': 'SBI',
  'IDBI': 'IDBI',
  'Kotak Mahindra': 'KMB',
  'Standard Chartered': 'SCB',
  'IndusInd': 'IIB',
  'IDFC': 'IDFC',
  'Bank of Baroda': 'BOB',
  'Canara': 'CAN',
  'Indian': 'IND',
  'Equitas': 'EQB',
  'RBL': 'RBL',
  'Indian Overseas': 'IOB',
  'Union': 'UBI',
  'Punjab National': 'PNB',
  'City Union': 'CUB',
  'UCO': 'UCO',
  'Yes': 'YES',
  'Federal': 'FBL',
  'HSBC': 'HSBC',
  'Citi': 'CITI',
  'American Express': 'AMEX',
  'Other': 'BANK',
};

function ChipIcon() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="30" rx="5" fill="#D4AF37" fillOpacity="0.85" />
      <rect x="15" y="0" width="10" height="30" fill="#B8971E" fillOpacity="0.25" />
      <rect x="0" y="10" width="40" height="10" fill="#B8971E" fillOpacity="0.25" />
      <rect x="13" y="8" width="14" height="14" rx="2.5" fill="none" stroke="#A07A10" strokeWidth="1.5" />
    </svg>
  );
}

function NetworkBadge({ cardNumber }: { cardNumber: string }) {
  const num = cardNumber.replace(/\s/g, '');
  if (num.startsWith('34') || num.startsWith('37')) {
    return <span className="font-bold text-xs tracking-widest opacity-90 bg-white/20 px-2 py-0.5 rounded">AMEX</span>;
  }
  if (num.startsWith('4')) {
    return <span className="italic font-black text-xl opacity-90" style={{ fontFamily: 'serif' }}>VISA</span>;
  }
  if (num.match(/^(5[1-5]|2[2-7])/)) {
    return (
      <svg width="38" height="24" viewBox="0 0 38 24">
        <circle cx="14" cy="12" r="11" fill="#EB001B" fillOpacity="0.9" />
        <circle cx="24" cy="12" r="11" fill="#F79E1B" fillOpacity="0.9" />
        <ellipse cx="19" cy="12" rx="5" ry="11" fill="#FF5F00" fillOpacity="0.65" />
      </svg>
    );
  }
  if (num.startsWith('60') || num.startsWith('65') || num.startsWith('81') || num.startsWith('82')) {
    return <span className="font-bold text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded tracking-wide">RuPay</span>;
  }
  return null;
}

interface CardItemProps {
  card: CardType;
  isSelected?: boolean;
}

export default function CardItem({ card, isSelected = false }: CardItemProps) {
  const bankAbbr =
    BANK_ABBR[card.issuer] ??
    card.customBankName?.substring(0, 4).toUpperCase() ??
    'BANK';
  const formattedNumber = card.cardNumber
    .replace(/\s/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();

  return (
    <div
      className={`relative h-52 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl overflow-hidden select-none transition-all ${
        isSelected ? 'ring-2 ring-white/60 scale-[1.02]' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${card.color}f0 0%, ${card.color}99 55%, ${card.color}cc 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-black/10 pointer-events-none" />

      {/* Row 1: Bank badge + Network logo */}
      <div className="relative flex items-center justify-between">
        <div className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          <span className="font-bold text-sm tracking-wider">{bankAbbr}</span>
        </div>
        <NetworkBadge cardNumber={card.cardNumber} />
      </div>

      {/* Row 2: Chip + Card number */}
      <div className="relative space-y-1.5">
        <ChipIcon />
        <p className="font-mono text-sm tracking-[0.2em] font-semibold text-white/95">
          {formattedNumber}
        </p>
      </div>

      {/* Row 3: Cardholder / Expiry */}
      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[9px] font-medium uppercase opacity-60 tracking-wider">Card Holder</p>
          <p className="font-semibold text-sm uppercase tracking-wide">{card.cardHolder}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-medium uppercase opacity-60 tracking-wider">Expiry</p>
          <p className="font-mono font-semibold text-sm">{card.expiryDate}</p>
        </div>
      </div>
    </div>
  );
}
