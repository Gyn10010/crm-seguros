import React from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
        <h2 className="text-xl font-bold text-text-primary mb-4">Confirmar Saída</h2>
        <p className="text-text-secondary mb-6">Você tem certeza que deseja sair do sistema?</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ui-card text-text-secondary border border-ui-border rounded-md hover:bg-ui-hover"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-danger text-white font-semibold rounded-md hover:bg-danger/90"
          >
            Sim, Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
