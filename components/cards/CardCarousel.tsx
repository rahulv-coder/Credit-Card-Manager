'use client';

import React from 'react';
import { Card as CardType } from '@/lib/types';
import CardItem from './CardItem';

interface CardCarouselProps {
  cards: CardType[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
}

export default function CardCarousel({
  cards,
  selectedCardId,
  onSelectCard,
}: CardCarouselProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Your Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-2">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onSelectCard(card.id)}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <CardItem
              card={card}
              isSelected={card.id === selectedCardId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
