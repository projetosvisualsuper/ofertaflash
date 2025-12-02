import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  variant?: 'danger' | 'default';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isConfirming = false,
  variant = 'default',
}) => {
  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
        <DialogHeader className="flex flex-row items-center gap-4">
          <AlertTriangle size={32} className={variant === 'danger' ? 'text-red-500' : 'text-yellow-500'} />
          <div>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <DialogFooter className="mt-4 flex justify-end gap-3">
          <DialogClose asChild>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isConfirming}
            >
              {cancelText}
            </button>
          </DialogClose>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${confirmButtonClass} disabled:opacity-50`}
          >
            {isConfirming ? <Loader2 className="animate-spin" size={16} /> : null}
            {isConfirming ? 'Processando...' : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;