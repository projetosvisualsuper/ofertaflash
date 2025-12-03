import React, { useState, useMemo } from 'react';
import { LayoutTemplate, Plus, Loader2, Trash2, Save, XCircle, Image as ImageIcon, Type, Brush, CaseUpper, CaseLower } from 'lucide-react';
import { useGlobalHeaderTemplates } from '../../hooks/useGlobalHeaderTemplates';
import { useAuth } from '../../context/AuthContext';
import { PosterTheme, HeaderTemplate, HeaderAndFooterElements, HeaderElement, HeaderImageMode } from '../../../types';
import { showSuccess, showError } from '../../utils/toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { HEADER_LAYOUT_PRESETS } from '../../config/headerLayoutPresets';
import { HEADER_ART_PRESETS } from '../../config/headerArtPresets';
import { FONT_PRESETS } from '../../config/fontPresets';
import { INITIAL_THEME } from '../../state/initialState';

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

// Estado inicial para o tema do template (focado apenas nas propriedades do cabeçalho)
const initialTemplateTheme: Partial<PosterTheme> = {
    primaryColor: '#4f46e5',
    secondaryColor: '#facc15',
    headerTextColor: '#ffffff',
    fontFamilyDisplay: 'Oswald, sans-serif',
    headerArtStyleId: 'block',
    headerLayoutId: 'text-only',
    headerTitleCase: 'uppercase',
    headerImage: undefined,
    headerImageMode: 'none',
    headerImageOpacity: 0.5,
    useLogoOnHero: false,
    // Usamos o formato 'a4' como base para os textos padrão
    headerElements: INITIAL_THEME.headerElements,
};

const AdminGlobalTemplatesPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const { globalTemplates, addGlobalTemplate, deleteGlobalTemplate, loading } = useGlobalHeaderTemplates(isAdmin);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateThumb, setNewTemplateThumb] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado local para as configurações do template
  const [templateTheme, setTemplateTheme] = useState<Partial<PosterTheme>>(initialTemplateTheme);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<HeaderTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Usamos 'a4' como formato de referência para editar os textos
  const currentFormatId = 'a4'; 
  const currentHeaderElements = templateTheme.headerElements?.[currentFormatId] || INITIAL_THEME.headerElements[currentFormatId];

  const handleThemeChange = (key: keyof Partial<PosterTheme>, value: any) => {
    setTemplateTheme(prev => ({ ...prev, [key]: value }));
  };
  
  const handleHeaderElementChange = (element: keyof HeaderAndFooterElements, property: keyof HeaderElement, value: string | number) => {
    setTemplateTheme(prevTheme => {
      const newHeaderElements = { ...prevTheme.headerElements };
      if (!newHeaderElements) return prevTheme;
      
      newHeaderElements[currentFormatId] = {
        ...newHeaderElements[currentFormatId],
        [element]: {
          ...newHeaderElements[currentFormatId][element],
          [property]: value,
        },
      };
      return { ...prevTheme, headerElements: newHeaderElements };
    });
  };

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
    
    setIsSaving(true);
    
    // 1. Criar o objeto de tema parcial para salvar
    const themeToSave: Partial<PosterTheme> = {
      primaryColor: templateTheme.primaryColor,
      secondaryColor: templateTheme.secondaryColor,
      headerTextColor: templateTheme.headerTextColor,
      fontFamilyDisplay: templateTheme.fontFamilyDisplay,
      headerArtStyleId: templateTheme.headerArtStyleId,
      headerLayoutId: templateTheme.headerLayoutId,
      headerTitleCase: templateTheme.headerTitleCase,
      headerImage: templateTheme.headerImage,
      headerImageMode: templateTheme.headerImageMode,
      useLogoOnHero: templateTheme.useLogoOnHero,
      headerImageOpacity: templateTheme.headerImageOpacity,
      // Salvamos apenas os elementos de cabeçalho do formato 'a4' como referência
      headerElements: { [currentFormatId]: currentHeaderElements },
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
        setTemplateTheme(initialTemplateTheme); // Resetar o formulário
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
          
          {/* Preview do Tema Atual */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Preview de Cores</label>
            <div 
                className="w-full h-16 flex items-center justify-center rounded-lg border"
                style={{ 
                    backgroundColor: templateTheme.primaryColor, 
                    color: templateTheme.headerTextColor,
                    boxShadow: `0 0 0 4px ${templateTheme.secondaryColor} inset`,
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
              <div className="mt-2 relative w-24 h-24 rounded-md overflow-hidden border">
                <img src={newTemplateThumb} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setNewTemplateThumb(null)} className="absolute top-1 right-1 bg-white/70 rounded-full p-0.5 text-red-600 hover:bg-white" disabled={isSaving}>
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </div>
          
          {/* Controles de Design */}
          <details className="space-y-3 border-t pt-4" open>
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2"><Brush size={16}/> Cores e Fontes</summary>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-600">Cor Primária</label><input type="color" value={templateTheme.primaryColor} onChange={(e) => handleThemeChange('primaryColor', e.target.value)} className="w-full h-8 border rounded cursor-pointer" /></div>
                <div><label className="text-xs font-medium text-gray-600">Cor Secundária</label><input type="color" value={templateTheme.secondaryColor} onChange={(e) => handleThemeChange('secondaryColor', e.target.value)} className="w-full h-8 border rounded cursor-pointer" /></div>
                <div><label className="text-xs font-medium text-gray-600">Texto Cabeçalho</label><input type="color" value={templateTheme.headerTextColor} onChange={(e) => handleThemeChange('headerTextColor', e.target.value)} className="w-full h-8 border rounded cursor-pointer" /></div>
                <div><label className="text-xs font-medium text-gray-600">Fonte Título</label><select value={templateTheme.fontFamilyDisplay} onChange={(e) => handleThemeChange('fontFamilyDisplay', e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-white"><option value="" disabled>Selecione...</option>{FONT_PRESETS.map(font => <option key={font.id} value={font.fontFamily}>{font.name}</option>)}</select></div>
            </div>
          </details>
          
          {/* Controles de Layout */}
          <details className="space-y-3 border-t pt-4" open>
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2"><LayoutTemplate size={16}/> Layout e Arte</summary>
            <div><label className="text-xs font-medium text-gray-600">Layout do Logo</label><div className="grid grid-cols-4 gap-1 mt-1">{HEADER_LAYOUT_PRESETS.map(preset => (<button key={preset.id} onClick={() => handleThemeChange('headerLayoutId', preset.id)} className={`p-2 border rounded flex flex-col items-center ${templateTheme.headerLayoutId === preset.id ? 'bg-indigo-100 border-indigo-500' : 'bg-white'}`}><preset.icon size={20} /><span className="text-[10px] mt-1">{preset.name}</span></button>))}</div></div>
            <div><label className="text-xs font-medium text-gray-600">Estilo de Arte</label><div className="grid grid-cols-4 gap-1 mt-1">{HEADER_ART_PRESETS.map(preset => (<button key={preset.id} onClick={() => handleThemeChange('headerArtStyleId', preset.id)} className={`p-2 border rounded flex flex-col items-center ${templateTheme.headerArtStyleId === preset.id ? 'bg-indigo-100 border-indigo-500' : 'bg-white'}`}><preset.icon size={20} /><span className="text-[10px] mt-1">{preset.name}</span></button>))}</div></div>
            <div className="flex justify-between items-center"><label className="text-xs font-medium text-gray-600">Caixa do Título</label><div className="flex border rounded-md overflow-hidden"><button onClick={() => handleThemeChange('headerTitleCase', 'uppercase')} className={`p-1 ${templateTheme.headerTitleCase === 'uppercase' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'}`} title="Caixa Alta"><CaseUpper size={16}/></button><button onClick={() => handleThemeChange('headerTitleCase', 'capitalize')} className={`p-1 ${templateTheme.headerTitleCase === 'capitalize' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'}`} title="Capitalizado"><CaseLower size={16}/></button></div></div>
          </details>
          
          {/* Controles de Texto (A4 como referência) */}
          <details className="space-y-3 border-t pt-4" open>
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2"><Type size={16}/> Textos Padrão (A4)</summary>
            <div>
                <label className="text-xs font-medium text-gray-600">Título Principal</label>
                <input type="text" value={currentHeaderElements.headerTitle.text} onChange={(e) => handleHeaderElementChange('headerTitle', 'text', e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none" placeholder="SUPER OFERTAS" />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-600">Subtítulo</label>
                <input type="text" value={currentHeaderElements.headerSubtitle.text} onChange={(e) => handleHeaderElementChange('headerSubtitle', 'text', e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none" placeholder="SÓ HOJE" />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-600">Texto do Rodapé</label>
                <input type="text" value={currentHeaderElements.footerText.text} onChange={(e) => handleHeaderElementChange('footerText', 'text', e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none" placeholder="Ofertas válidas..." />
            </div>
          </details>

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