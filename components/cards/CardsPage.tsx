'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import CardCarousel from './CardCarousel';
import CardDetails from './CardDetails';
import AddCardModal from './AddCardModal';
import AddTransactionModal from './AddTransactionModal';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CardsPage() {
  const { data, deleteCard } = useData();
  const searchParams = useSearchParams();
  const modalType = searchParams.get('modal');
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    data.cards.length > 0 ? data.cards[0].id : null
  );
  const [showAddCardModal, setShowAddCardModal] = useState(modalType === 'add-card');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(modalType === 'add-transaction');
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (data.cards.length > 0 && !selectedCardId) {
      setSelectedCardId(data.cards[0].id);
    }
  }, [data.cards, selectedCardId]);

  const selectedCard = data.cards.find(c => c.id === selectedCardId);

  const handleDeleteCard = async () => {
    if (selectedCard) {
      await deleteCard(selectedCard.id);
      setShowDeleteConfirm(false);
      // Select the first card if available
      if (data.cards.length > 1) {
        const newSelectedId = data.cards.find(c => c.id !== selectedCard.id)?.id;
        setSelectedCardId(newSelectedId || null);
      } else {
        setSelectedCardId(null);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Cards</h1>
          <p className="text-muted-foreground">Manage your credit cards and transactions</p>
        </div>
          <div className="flex gap-2">
            {selectedCard && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={20} />
                <span className="hidden sm:inline">Delete Card</span>
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingCard(null);
                setShowAddCardModal(true);
              }}
              className="gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Card</span>
            </Button>
          </div>
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
          onEditCard={() => {
            setEditingCard(selectedCard);
            setShowAddCardModal(true);
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
          <p className="text-muted-foreground">No cards yet. Add your first card to get started.</p>
        </div>
      )}

      {/* Modals */}
      <AddCardModal
        open={showAddCardModal}
        onOpenChange={(open) => {
          setShowAddCardModal(open);
          if (!open) setEditingCard(null);
        }}
        initialCard={editingCard}
      />
      {selectedCard && (
        <AddTransactionModal
          open={showAddTransactionModal}
          onOpenChange={setShowAddTransactionModal}
          cardId={selectedCard.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCard?.name}</strong> (ending in {selectedCard?.cardNumber.slice(-4)})? 
              This action will also delete all transactions associated with this card and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mt-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Deleting a card will permanently remove all its transactions from your records.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
