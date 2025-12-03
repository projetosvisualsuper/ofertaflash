import React, { useState, useMemo } from 'react';
import { LayoutTemplate, Plus, Loader2, Trash2, Save, XCircle, Image as ImageIcon } from 'lucide-react';
import { useGlobalHeaderTemplates } from '../../hooks/useGlobalHeaderTemplates';
import { useAuth } from '../../context/AuthContext';
import { PosterTheme, HeaderTemplate } from '../../../types';
import { showSuccess, showError } from '../../utils/toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { INITIAL_THEME } from '../../state/initialState';

// Componente auxiliar para renderizar a pré-visualização do template
const TemplatePreview: React.FC<{ template: HeaderTemplate; onDelete: (id: string) => void; isDeleting: boolean }> = ({ template, onDelete, isDeleting }) => {
    // Usamos a miniatura como a imagem de fundo para o preview
    const thumbnailSrc = template.thumbnail;

    return (
        <div className="relative group bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div 
                className="w-full h-24 flex items-center justify-center"
                style={{ 
                    backgroundColor: '#f3f4f6', // Cor de fundo neutra
                    backgroundImage: thumbnailSrc ? `url(${thumbnailSrc})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                }}
            >
                {/* Nome do Template no centro */}
                <span 
                    className="relative z-10 text-center text-sm font-bold p-1 rounded bg-black/50 text-white"
                >
                    {template.name}
                </span>
            </div>
            
            <div className="p-2 text-center">
                <p className="text-xs font-semibold text-gray-800 truncate">{template.name}</p>
            </div>
            
            <button
                onClick={() => onDelete(template.id)}
                disabled={isDeleting}
                className="absolute top-1 right-1 p-1 text-red-500 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md disabled:opacity-50"
                title="Excluir Template Global"
            >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
        </div>
    );
};

const AdminGlobalTemplatesPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const { globalTemplates, addGlobalTemplate, deleteGlobalTemplate, loading } = useGlobalHeaderTemplates(isAdmin);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateThumb, setNewTemplateThumb] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<HeaderTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTemplateThumb(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateThumb) {
      showError("Nome e Imagem do Cabeçalho são obrigatórios.");
      return;
    }
    
    setIsSaving(true);
    
    // O tema salvo deve ser mínimo, apenas o suficiente para forçar o comportamento desejado
    const themeToSave: Partial<PosterTheme> = {
      // A miniatura (newTemplateThumb) será usada como headerImage no applyCustomTemplate
      // Definimos o modo como 'hero' e o layout como 'text-only' para garantir que a imagem domine
      headerImageMode: 'hero',
      headerLayoutId: 'text-only',
      // Cores neutras de fallback
      primaryColor: INITIAL_THEME.primaryColor,
      secondaryColor: INITIAL_THEME.secondaryColor,
      headerTextColor: INITIAL_THEME.headerTextColor,
      // Salvamos os textos padrão para que o template tenha um título inicial
      headerElements: INITIAL_THEME.headerElements,
    };

    const newTemplate: Omit<HeaderTemplate, 'id'> = {
      name: newTemplateName.trim(),
      // A miniatura é a imagem do cabeçalho
      thumbnail: newTemplateThumb, 
      theme: themeToSave,
    };

    const result = await addGlobalTemplate(newTemplate);

    if (result) {
        setNewTemplateName('');
        setNewTemplateThumb(null);
    }
    setIsSaving(false);
  };
  
  const handleDeleteClick = (template: HeaderTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    
    setIsDeleting(true);
    await deleteGlobalTemplate(templateToDelete.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setTemplateToDelete(null);
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-500">Acesso negado.</div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <LayoutTemplate size={32} className="text-indigo-600" />
        Gerenciamento de Templates Globais
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna de Cadastro (Simplificada) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Cadastrar Novo Template</h3>
          
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
                <span className="font-bold">Instrução:</span> Salve apenas a imagem do cabeçalho e o nome. Ao ser aplicado, o template usará esta imagem e manterá as cores e textos atuais do usuário.
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nome do Template</label>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Black Friday 2024"
              disabled={isSaving}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Imagem do Cabeçalho (Miniatura)</label>
            <input type="file" id="admin-template-thumb-upload" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={isSaving} />
            <label htmlFor="admin-template-thumb-upload" className={`w-full flex items-center justify-center gap-2 text-sm py-2 px-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isSaving ? 'bg-gray-200 text-gray-500' : 'hover:bg-gray-100'}`}>
              <ImageIcon size={16} />
              {newTemplateThumb ? 'Trocar Imagem' : 'Selecionar Imagem (1:1 ou 16:9)'}
            </label>
            {newTemplateThumb && (
              <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border flex items-center justify-center bg-gray-100">
                <img src={newTemplateThumb} alt="Preview" className="max-w-full max-h-full object-contain" />
                <button onClick={() => setNewTemplateThumb(null)} className="absolute top-1 right-1 bg-white/70 rounded-full p-0.5 text-red-600 hover:bg-white" disabled={isSaving}>
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving || !newTemplateName.trim() || !newTemplateThumb}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Salvando...' : 'Salvar Template Global'}
          </button>
        </div>
        
        {/* Coluna de Visualização */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Templates Globais Ativos ({globalTemplates.length})</h3>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="ml-4 text-gray-600">Carregando templates...</p>
            </div>
          ) : globalTemplates.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500">
              <LayoutTemplate size={32} className="mx-auto mb-2" />
              <p>Nenhum template global cadastrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto p-2">
              {globalTemplates.map(template => (
                <TemplatePreview 
                    key={template.id} 
                    template={template} 
                    onDelete={() => handleDeleteClick(template)} 
                    isDeleting={isDeleting && templateToDelete?.id === template.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão de Template Global"
        description={`Tem certeza que deseja excluir o template global "${templateToDelete?.name}"? Ele será removido da galeria de todos os usuários.`}
        confirmText="Excluir Permanentemente"
        isConfirming={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default AdminGlobalTemplatesPage;