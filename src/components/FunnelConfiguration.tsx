import React, { useState, useMemo } from 'react';
import { LDRState } from '../hooks/useLDRState';
import { FunnelConfiguration, FunnelStage } from '../types/index';
import { Button } from './ui/button';
import { TrashIcon, EditIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import { Card } from './ui/card';

interface FunnelConfigurationProps {
  ldrState: LDRState;
}

const FunnelModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { funnelName: string }) => void;
  funnel: FunnelConfiguration | null;
}> = ({ isOpen, onClose, onSubmit, funnel }) => {
  const [funnelName, setFunnelName] = useState(funnel?.funnelName || '');

  React.useEffect(() => {
    if (funnel) {
      setFunnelName(funnel.funnelName);
    } else {
      setFunnelName('');
    }
  }, [funnel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ funnelName });
    setFunnelName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          {funnel ? 'Editar Funil' : 'Novo Funil'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Fechar"
        >
          <CloseIcon />
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="funnelName" className="block text-sm font-medium text-text-secondary mb-1">
              Nome do Funil
            </label>
            <input
              type="text"
              name="funnelName"
              id="funnelName"
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              placeholder="Ex: Vendas"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {funnel ? 'Salvar Alterações' : 'Criar Funil'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { stageName: string }) => void;
  stage: FunnelStage | null;
  funnelName: string;
}> = ({ isOpen, onClose, onSubmit, stage, funnelName }) => {
  const [stageName, setStageName] = useState(stage?.stageName || '');

  React.useEffect(() => {
    if (stage) {
      setStageName(stage.stageName);
    } else {
      setStageName('');
    }
  }, [stage, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ stageName });
    setStageName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          {stage ? 'Editar Estágio' : 'Novo Estágio'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Fechar"
        >
          <CloseIcon />
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Funil: <span className="font-bold text-text-primary">{funnelName}</span>
            </label>
          </div>
          <div>
            <label htmlFor="stageName" className="block text-sm font-medium text-text-secondary mb-1">
              Nome do Estágio
            </label>
            <input
              type="text"
              name="stageName"
              id="stageName"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              placeholder="Ex: Proposta"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {stage ? 'Salvar Alterações' : 'Adicionar Estágio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FunnelConfigurationComponent: React.FC<FunnelConfigurationProps> = ({ ldrState }) => {
  const {
    funnelConfigurations,
    funnelStages,
    addFunnelConfiguration,
    updateFunnelConfiguration,
    deleteFunnelConfiguration,
    moveFunnelConfiguration,
    addFunnelStage,
    updateFunnelStage,
    deleteFunnelStage,
    moveFunnelStage
  } = ldrState;

  const [selectedFunnelKey, setSelectedFunnelKey] = useState<string | null>(
    funnelConfigurations.length > 0 ? funnelConfigurations[0].funnelKey : null
  );
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<FunnelConfiguration | null>(null);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);

  const selectedFunnel = useMemo(() => {
    return funnelConfigurations.find(f => f.funnelKey === selectedFunnelKey);
  }, [funnelConfigurations, selectedFunnelKey]);

  const filteredStages = useMemo(() => {
    if (!selectedFunnelKey) return [];
    return funnelStages
      .filter(s => s.funnelKey === selectedFunnelKey)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [funnelStages, selectedFunnelKey]);

  const sortedFunnels = useMemo(() => {
    return [...funnelConfigurations].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [funnelConfigurations]);

  const handleOpenFunnelModal = (funnel: FunnelConfiguration | null = null) => {
    setEditingFunnel(funnel);
    setIsFunnelModalOpen(true);
  };

  const handleCloseFunnelModal = () => {
    setEditingFunnel(null);
    setIsFunnelModalOpen(false);
  };

  const handleSubmitFunnel = (data: { funnelName: string }) => {
    if (editingFunnel) {
      updateFunnelConfiguration({ ...editingFunnel, funnelName: data.funnelName });
    } else {
      addFunnelConfiguration(data.funnelName);
    }
    handleCloseFunnelModal();
  };

  const handleOpenStageModal = (stage: FunnelStage | null = null) => {
    setEditingStage(stage);
    setIsStageModalOpen(true);
  };

  const handleCloseStageModal = () => {
    setEditingStage(null);
    setIsStageModalOpen(false);
  };

  const handleSubmitStage = (data: { stageName: string }) => {
    if (!selectedFunnelKey) return;

    if (editingStage) {
      updateFunnelStage({ ...editingStage, stageName: data.stageName });
    } else {
      addFunnelStage(selectedFunnelKey, data.stageName);
    }
    handleCloseStageModal();
  };

  return (
    <div className="space-y-6">
      <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Configuração de Funis</h1>
            <p className="text-text-secondary mt-1">
              Gerencie os funis de vendas e seus estágios
            </p>
          </div>
          <Button onClick={() => handleOpenFunnelModal()}>
            + Novo Funil
          </Button>
        </div>

        {/* Lista de Funis */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Funis Cadastrados</h2>
          <div className="space-y-2">
            {sortedFunnels.length === 0 ? (
              <p className="text-center text-text-muted py-8">
                Nenhum funil cadastrado. Crie seu primeiro funil para começar.
              </p>
            ) : (
              sortedFunnels.map((funnel, index) => (
                <Card
                  key={funnel.id}
                  className={`p-4 cursor-pointer transition-colors ${selectedFunnelKey === funnel.funnelKey
                      ? 'bg-brand-primary/10 border-brand-primary'
                      : 'bg-ui-background border-ui-border hover:bg-ui-hover'
                    }`}
                  onClick={() => setSelectedFunnelKey(funnel.funnelKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-sm font-bold text-text-secondary">
                        #{index + 1}
                      </span>
                      <span className={`font-semibold ${selectedFunnelKey === funnel.funnelKey ? 'text-brand-primary' : 'text-text-primary'
                        }`}>
                        {funnel.funnelName}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({funnelStages.filter(s => s.funnelKey === funnel.funnelKey).length} estágios)
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveFunnelConfiguration(funnel.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-text-secondary hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveFunnelConfiguration(funnel.id, 'down')}
                        disabled={index === sortedFunnels.length - 1}
                        className="p-1 text-text-secondary hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenFunnelModal(funnel)}
                        className="p-1 text-text-secondary hover:text-brand-primary"
                        title="Editar"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => deleteFunnelConfiguration(funnel.id)}
                        className="p-1 text-text-secondary hover:text-danger"
                        title="Excluir"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Estágios do Funil Selecionado */}
        {selectedFunnel && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Estágios de: <span className="text-brand-primary">{selectedFunnel.funnelName}</span>
              </h2>
              <Button onClick={() => handleOpenStageModal()}>
                + Novo Estágio
              </Button>
            </div>

            <div className="space-y-2">
              {filteredStages.length === 0 ? (
                <p className="text-center text-text-muted py-8">
                  Nenhum estágio configurado para este funil.
                </p>
              ) : (
                filteredStages.map((stage, index) => (
                  <Card key={stage.id} className="p-4 bg-ui-background border border-ui-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm font-bold text-text-secondary">
                          #{index + 1}
                        </span>
                        <span className="text-text-primary font-medium">{stage.stageName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveFunnelStage(stage.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-text-secondary hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover para cima"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveFunnelStage(stage.id, 'down')}
                          disabled={index === filteredStages.length - 1}
                          className="p-1 text-text-secondary hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover para baixo"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenStageModal(stage)}
                          className="p-1 text-text-secondary hover:text-brand-primary"
                          title="Editar"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => deleteFunnelStage(stage.id)}
                          className="p-1 text-text-secondary hover:text-danger"
                          title="Excluir"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <FunnelModal
        isOpen={isFunnelModalOpen}
        onClose={handleCloseFunnelModal}
        onSubmit={handleSubmitFunnel}
        funnel={editingFunnel}
      />

      <StageModal
        isOpen={isStageModalOpen}
        onClose={handleCloseStageModal}
        onSubmit={handleSubmitStage}
        stage={editingStage}
        funnelName={selectedFunnel?.funnelName || ''}
      />
    </div>
  );
};

export default FunnelConfigurationComponent;