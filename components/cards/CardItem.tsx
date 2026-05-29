'use client';

import React from 'react';
import { Card as CardType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { formatCardNumber } from '@/lib/utils/formatting';

interface CardItemProps {
  card: CardType;
  isSelected?: boolean;
}

export default function CardItem({ card, isSelected = false }: CardItemProps) {
  return (
    <Card
      className={`p-6 text-white h-56 flex flex-col justify-between rounded-xl shadow-lg border-2 transition-all ${
        isSelected ? 'border-white/50 ring-2 ring-white/20' : 'border-transparent'
      }`}
      style={{
        background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)`,
      }}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-75">Card Name</p>
          <p className="text-lg font-semibold">{card.name}</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-medium opacity-75">Issuer</p>
          <p className="font-semibold">{card.customBankName || card.issuer}</p>
        </div>
      </div>

      {/* Middle Section */}
      <div>
        <p className="text-xs font-medium opacity-75 mb-2">Card Number</p>
        <p className="text-lg font-mono tracking-widest">{formatCardNumber(card.cardNumber)}</p>
      </div>

      {/* Bottom Section */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium opacity-75">Cardholder</p>
          <p className="font-semibold">{card.cardHolder}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium opacity-75">Expiry</p>
          <p className="font-mono font-semibold">{card.expiryDate}</p>
        </div>
      </div>
    </Card>
  );
}
