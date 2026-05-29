'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import CardCarousel from './CardCarousel';
import CardDetails from './CardDetails';
import AddCardModal from './AddCardModal';
import AddTransactionModal from './AddTransactionModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CardsPage() {
  const { data } = useData();
  const searchParams = useSearchParams();
  const modalType = searchParams.get('modal');
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    data.cards.length > 0 ? data.cards[0].id : null
  );
  const [showAddCardModal, setShowAddCardModal] = useState(modalType === 'add-card');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(modalType === 'add-transaction');

  const selectedCard = data.cards.find(c => c.id === selectedCardId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Cards</h1>
          <p className="text-muted-foreground">Manage your credit cards and transactions</p>
        </div>
        <Button onClick={() => setShowAddCardModal(true)} className="gap-2">
          <Plus size={20} />
          <span className="hidden sm:inline">Add Card</span>
        </Button>
      </div>

      {/* Cards Carousel */}
      <CardCarousel
        cards={data.cards}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
      />

      {/* Card Details */}
      {selectedCard ? (
        <CardDetails
          card={selectedCard}
          transactions={data.transactions.filter(t => t.cardId === selectedCard.id)}
          onAddTransaction={() => setShowAddTransactionModal(true)}
        />
      ) : (
        <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
          <p className="text-muted-foreground">No cards yet. Add your first card to get started.</p>
        </div>
      )}

      {/* Modals */}
      <AddCardModal
        open={showAddCardModal}
        onOpenChange={setShowAddCardModal}
      />
      {selectedCard && (
        <AddTransactionModal
          open={showAddTransactionModal}
          onOpenChange={setShowAddTransactionModal}
          cardId={selectedCard.id}
        />
      )}
    </div>
  );
}
