import React, { useState, useEffect } from 'react';
import { DollarSign, Zap, Save, Loader2, Plus, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCreditPackages, CreditPackage } from '../../hooks/useCreditPackages';
import { showError, showSuccess } from '../../utils/toast';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminCreditPackagesPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { packages, loading, updatePackage, addPackage, deletePackage } = useCreditPackages(isAdmin);
  
  const [localPackages, setLocalPackages] = useState<CreditPackage[]>([]);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<CreditPackage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Sincroniza os pacotes carregados com o estado local
    setLocalPackages(packages);
  }, [packages]);

  const handleFieldChange = (id: string, field: keyof CreditPackage, value: string | number | boolean) => {
    setLocalPackages(prev => prev.map(pkg => 
      pkg.id === id 
        ? { ...pkg, [field]: value } 
        : pkg
    ));
  };
  
  const handleAddPackage = () => {
    const newId = crypto.randomUUID();
    setLocalPackages(prev => [
        ...prev,
        {
            id: newId,
            name: 'Novo Pacote',
            amount: 100,
            price: 10.00,
            description: 'Descrição do novo pacote.',
            is_active: true,
        }
    ]);
  };

  const handleSavePackage = async (pkg: CreditPackage) => {
    if (!isAdmin) {
      showError("Apenas administradores podem salvar estas configurações.");
      return;
    }
    
    const amount = parseInt(pkg.amount as any, 10);
    const price = parseFloat(pkg.price as any);
    
    if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
        showError("Créditos e Preço devem ser números positivos.");
        return;
    }
    
    setIsSavingId(pkg.id);
    
    try {
        const updates = {
            name: pkg.name,
            amount: amount,
            price: price,
            description: pkg.description,
            is_active: pkg.is_active,
        };
        
        // Verifica se o pacote é novo (não tem ID no DB)
        const originalPackage = packages.find(p => p.id === pkg.id);
        
        if (originalPackage) {
            await updatePackage(pkg.id, updates);
        } else {
            // Se for um pacote recém-adicionado localmente, insere
            await addPackage(updates);
        }
        
    } catch (e) {
        // Erro já tratado no hook
    } finally {
        setIsSavingId(null);
    }
  };
  
  const handleDeleteClick = (pkg: CreditPackage) => {
    setPackageToDelete(pkg);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;
    
    setIsDeleting(true);
    try {
        await deletePackage(packageToDelete.id);
        // Remove do estado local se a exclusão for bem-sucedida
        setLocalPackages(prev => prev.filter(p => p.id !== packageToDelete.id));
    } catch (e) {
        // Erro já tratado no hook
    } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setPackageToDelete(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-500">Acesso negado.</div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <DollarSign size={32} className="text-green-600" />
        Gerenciamento de Pacotes de Crédito
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Defina os pacotes de créditos avulsos que os usuários podem comprar.
      </p>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6 max-w-4xl">
        <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" /> Pacotes Ativos ({localPackages.filter(p => p.is_active).length})
            </h3>
            <button
                onClick={handleAddPackage}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
                <Plus size={16} /> Adicionar Pacote
            </button>
        </div>
        
        {loading ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="ml-4 text-gray-600">Carregando pacotes...</p>
            </div>
        ) : (
            <div className="space-y-4">
                {localPackages.map(pkg => {
                    const isSaving = isSavingId === pkg.id;
                    const isNew = !packages.find(p => p.id === pkg.id); // Verifica se é novo no estado local
                    
                    return (
                        <div key={pkg.id} className={`p-4 border rounded-lg space-y-3 ${pkg.is_active ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-gray-800">{isNew ? 'NOVO PACOTE' : pkg.name}</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteClick(pkg)}
                                        disabled={isSaving}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                                        title="Excluir Pacote"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleSavePackage(pkg)}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                        {isSaving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Nome</label>
                                    <input
                                        type="text"
                                        value={pkg.name}
                                        onChange={(e) => handleFieldChange(pkg.id, 'name', e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        value={pkg.description}
                                        onChange={(e) => handleFieldChange(pkg.id, 'description', e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1 flex items-center gap-1">
                                        <Zap size={12} className="text-yellow-500" /> Créditos
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={pkg.amount}
                                        onChange={(e) => handleFieldChange(pkg.id, 'amount', parseInt(e.target.value, 10) || 0)}
                                        className="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1 flex items-center gap-1">
                                        <DollarSign size={12} className="text-green-600" /> Preço (BRL)
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={pkg.price}
                                        onChange={(e) => handleFieldChange(pkg.id, 'price', parseFloat(e.target.value) || 0)}
                                        className="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Ativo</label>
                                    <button
                                        onClick={() => handleFieldChange(pkg.id, 'is_active', !pkg.is_active)}
                                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${pkg.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                                        disabled={isSaving}
                                    >
                                        {pkg.is_active ? <Check size={16} /> : <X size={16} />}
                                        {pkg.is_active ? 'Ativo' : 'Inativo'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão de Pacote"
        description={`Tem certeza que deseja excluir o pacote "${packageToDelete?.name}"? Esta ação é irreversível e o pacote será removido da loja.`}
        confirmText="Excluir Permanentemente"
        isConfirming={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default AdminCreditPackagesPage;