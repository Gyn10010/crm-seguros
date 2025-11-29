import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, message, title = "Atenção" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-primary/90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
