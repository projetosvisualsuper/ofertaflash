import React, { useState, useMemo } from 'react';
import { LayoutTemplate, Plus, Loader2, Trash2, Save, XCircle, Image as ImageIcon } from 'lucide-react';
import { useGlobalHeaderTemplates } from '../../hooks/useGlobalHeaderTemplates';
import { useAuth } from '../../context/AuthContext';
import { PosterTheme, HeaderTemplate } from '../../../types';
import { showSuccess, showError } from '../../utils/toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

// Componente auxiliar para renderizar a pré-visualização do template
const TemplatePreview: React.FC<{ template: HeaderTemplate; onDelete: (id: string) => void; isDeleting: boolean }> = ({ template, onDelete, isDeleting }) => {
    const { primaryColor, secondaryColor, headerTextColor } = template.theme;

    return (
        <div className="relative group bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div 
                className="w-full h-24 flex items-center justify-center"
                style={{ 
                    backgroundColor: primaryColor || '#333', 
                    backgroundImage: template.thumbnail ? `url(${template.thumbnail})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                }}
            >
                {/* Overlay de cor secundária para dar um toque de design */}
                <div 
                    className="absolute inset-0 opacity-30" 
                    style={{ backgroundColor: secondaryColor || '#fff' }}
                />
                {/* Nome do Template no centro */}
                <span 
                    className="relative z-10 text-center text-sm font-bold p-1 rounded"
                    style={{ color: headerTextColor || '#fff', textShadow: '0 0 5px rgba(0,0,0,0.5)' }}
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
  
  // Usamos o hook com isAdmin=true para ter acesso às funções de escrita
  const { globalTemplates, addGlobalTemplate, deleteGlobalTemplate, loading, fetchTemplates } = useGlobalHeaderTemplates(isAdmin);
  
  // Usamos useLocalStorageState para persistir o tema atual do builder
  const [currentTheme, setCurrentTheme] = useLocalStorageState<PosterTheme>('adminTemplateTheme', {} as PosterTheme);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateThumb, setNewTemplateThumb] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<HeaderTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock de cores para o preview do tema atual (se o localStorage estiver vazio)
  const themePreview = useMemo(() => ({
    primaryColor: currentTheme.primaryColor || '#4f46e5',
    secondaryColor: currentTheme.secondaryColor || '#facc15',
    headerTextColor: currentTheme.headerTextColor || '#ffffff',
  }), [currentTheme]);

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
      showError("Nome e Miniatura são obrigatórios.");
      return;
    }
    
    if (!currentTheme.primaryColor) {
        showError("Carregue um tema no Builder primeiro para definir as cores.");
        return;
    }

    setIsSaving(true);
    
    // 1. Criar o objeto de tema parcial para salvar
    const themeToSave: Partial<PosterTheme> = {
      primaryColor: currentTheme.primaryColor,
      secondaryColor: currentTheme.secondaryColor,
      headerTextColor: currentTheme.headerTextColor,
      fontFamilyDisplay: currentTheme.fontFamilyDisplay,
      headerArtStyleId: currentTheme.headerArtStyleId,
      headerTitleCase: currentTheme.headerTitleCase,
      headerLayoutId: currentTheme.headerLayoutId,
      headerImage: currentTheme.headerImage,
      headerImageMode: currentTheme.headerImageMode,
      useLogoOnHero: currentTheme.useLogoOnHero,
      headerImageOpacity: currentTheme.headerImageOpacity,
      logo: currentTheme.logo,
      headerElements: currentTheme.headerElements,
    };

    const newTemplate: Omit<HeaderTemplate, 'id'> = {
      name: newTemplateName.trim(),
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
        
        {/* Coluna de Cadastro */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Cadastrar Novo Template</h3>
          
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm font-medium text-indigo-800">
                <span className="font-bold">Instrução:</span> Para salvar um template, primeiro vá para o "OfertaFlash Builder", configure o cabeçalho e as cores desejadas, e depois volte para esta página. O tema atual do Builder será usado como base.
            </p>
          </div>
          
          {/* Preview do Tema Atual */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Tema Atual do Builder</label>
            <div 
                className="w-full h-16 flex items-center justify-center rounded-lg border"
                style={{ 
                    backgroundColor: themePreview.primaryColor, 
                    color: themePreview.headerTextColor,
                    boxShadow: `0 0 0 4px ${themePreview.secondaryColor} inset`,
                }}
            >
                <span className="font-bold text-sm">Preview de Cores</span>
            </div>
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
            <label className="text-sm font-medium text-gray-700 block">Miniatura (Thumbnail)</label>
            <input type="file" id="admin-template-thumb-upload" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={isSaving} />
            <label htmlFor="admin-template-thumb-upload" className={`w-full flex items-center justify-center gap-2 text-sm py-2 px-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isSaving ? 'bg-gray-200 text-gray-500' : 'hover:bg-gray-100'}`}>
              <ImageIcon size={16} />
              {newTemplateThumb ? 'Trocar Miniatura' : 'Selecionar Miniatura (1:1)'}
            </label>
            {newTemplateThumb && (
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md relative">
                <img src={newTemplateThumb} alt="Preview" className="max-h-24 object-contain" />
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