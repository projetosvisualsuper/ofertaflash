import React, { useState } from 'react';
import { PosterTheme, HeaderTemplate } from '../../types';
import { HEADER_TEMPLATE_PRESETS } from '../config/headerTemplatePresets';
import { Save, Trash2, Upload, XCircle, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';
import { useCustomHeaderTemplates } from '../hooks/useCustomHeaderTemplates';
import { useGlobalHeaderTemplates } from '../hooks/useGlobalHeaderTemplates'; // NOVO IMPORT
import ConfirmationModal from './ConfirmationModal'; // Importando o modal

interface HeaderTemplatesTabProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
}

// Componente auxiliar para renderizar a pré-visualização do template
const TemplatePreview: React.FC<{ template: HeaderTemplate; isCustom: boolean; onApply: () => void; onDelete?: () => void; isFreePlan: boolean }> = ({ template, isCustom, onApply, onDelete, isFreePlan }) => {
    const { primaryColor, secondaryColor, headerTextColor } = template.theme;
    // Templates globais e presets hardcoded são bloqueados para Free
    const isLocked = isFreePlan && !isCustom; 

    // Se for um template global/preset, usamos a miniatura do template.
    // Se for um template customizado, usamos a miniatura salva pelo usuário.
    const thumbnailSrc = template.thumbnail;

    return (
        <div className="relative group">
            <button
                onClick={onApply}
                className={`w-full border rounded-lg overflow-hidden bg-white transition-all ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500'
                }`}
                disabled={isLocked}
            >
                {/* Área de Pré-visualização de Cor/Imagem */}
                <div 
                    className="w-full h-24 flex items-center justify-center"
                    style={{ 
                        backgroundColor: primaryColor || '#333', 
                        backgroundImage: thumbnailSrc ? `url(${thumbnailSrc})` : 'none',
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
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-700 truncate">{template.name}</p>
                </div>
            </button>
            
            {isCustom && onDelete && (
                <button
                    onClick={onDelete}
                    className="absolute top-0 right-0 p-1 text-red-500 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 shadow-md"
                    title="Excluir Template"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};


const HeaderTemplatesTab: React.FC<HeaderTemplatesTabProps> = ({ theme, setTheme }) => {
  const { profile, session } = useAuth();
  const isFreePlan = profile?.role === 'free';
  
  const { customTemplates, addCustomTemplate, deleteCustomTemplate } = useCustomHeaderTemplates(session?.user?.id);
  const { globalTemplates, loading: loadingGlobalTemplates } = useGlobalHeaderTemplates(false); // Busca templates globais
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateThumb, setNewTemplateThumb] = useState<string | null>(null);
  
  // Estados para o modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDeleteId, setTemplateToDeleteId] = useState<string | null>(null);

  // Combina templates hardcoded e templates globais do DB
  const allReadyTemplates = [...HEADER_TEMPLATE_PRESETS, ...globalTemplates];

  // For applying default templates from the gallery
  const applyPresetTemplate = (templateTheme: Partial<PosterTheme>) => {
    if (isFreePlan) {
        showError("A Galeria de Templates Prontos é exclusiva para planos Premium e Pro.");
        return;
    }
    
    // Verifica se o template tem uma imagem de cabeçalho (thumbnail ou headerImage)
    const hasHeaderImage = templateTheme.thumbnail || templateTheme.headerImage;

    if (hasHeaderImage) {
        setTheme(prevTheme => ({
            ...prevTheme,
            // Mescla as propriedades do template
            ...templateTheme, 
            
            // FORÇA O COMPORTAMENTO DE IMAGEM DE CABEÇALHO
            headerImage: templateTheme.thumbnail || templateTheme.headerImage, 
            headerImageMode: 'hero', // Modo Hero para garantir que a imagem seja a principal
            headerArtStyleId: 'block', // Desativa a arte geométrica
            
            // Garante que as cores e textos do usuário sejam mantidos se não estiverem no templateTheme
            primaryColor: templateTheme.primaryColor || prevTheme.primaryColor,
            secondaryColor: templateTheme.secondaryColor || prevTheme.secondaryColor,
            headerTextColor: templateTheme.headerTextColor || prevTheme.headerTextColor,
            headerElements: templateTheme.headerElements || prevTheme.headerElements,
            
            // Limpa o fundo geral para evitar conflito
            backgroundImage: undefined,
        }));
    } else {
        // Se não tiver imagem, aplica o tema normalmente (pode usar arte geométrica)
        setTheme(prevTheme => ({
            ...prevTheme,
            ...templateTheme,
            headerImage: undefined,
            headerImageMode: 'none',
        }));
    }
  };

  // For applying user-saved custom templates
  const applyCustomTemplate = (template: HeaderTemplate) => {
    if (isFreePlan) {
        showError("Para usar templates salvos, faça upgrade para o plano Premium ou Pro.");
        return;
    }
    setTheme(prevTheme => ({
      ...prevTheme,
      // Mescla o tema mínimo salvo (cores, textos, etc.)
      ...template.theme,
      
      // Sobrescreve com a imagem salva
      headerImage: template.thumbnail, // Use a thumbnail como a imagem principal
      headerImageMode: 'hero',
      headerArtStyleId: 'block', // Garante que a arte geométrica seja desativada
      useLogoOnHero: false, // Default to not showing logo over image
      backgroundImage: undefined, // Limpa o fundo geral
    }));
  };

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFreePlan) {
        showError("Funcionalidade de salvar templates é exclusiva para planos Premium e Pro.");
        return;
    }
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
    if (isFreePlan) {
        showError("Funcionalidade de salvar templates é exclusiva para planos Premium e Pro.");
        return;
    }
    if (!newTemplateName.trim() || !newTemplateThumb) {
      alert("Por favor, forneça um nome e uma imagem para o template.");
      return;
    }

    // Salva o tema mínimo para forçar o comportamento de imagem de cabeçalho
    const themeToSave: Partial<PosterTheme> = {
      headerImageMode: 'hero',
      headerLayoutId: 'text-only',
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      headerTextColor: theme.headerTextColor,
      headerElements: theme.headerElements,
      headerArtStyleId: 'block', // Garante que o template salvo desative a arte geométrica
    };

    const newTemplate: Omit<HeaderTemplate, 'id'> = {
      name: newTemplateName.trim(),
      thumbnail: newTemplateThumb,
      theme: themeToSave,
    };

    const result = await addCustomTemplate(newTemplate);

    if (result) {
        setNewTemplateName('');
        setNewTemplateThumb(null);
        showSuccess(`Template "${newTemplateName.trim()}" salvo com sucesso!`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTemplateToDeleteId(id);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!templateToDeleteId) return;
    
    setIsDeleteModalOpen(false);
    await deleteCustomTemplate(templateToDeleteId);
    setTemplateToDeleteId(null);
    showSuccess("Template excluído.");
  };

  const saveTemplateClasses = isFreePlan ? 'opacity-50 pointer-events-none' : '';

  return (
    <div className="space-y-6">
      <details className={`p-3 bg-gray-50 rounded-lg border ${saveTemplateClasses}`} open>
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2">
            Salvar Cabeçalho Atual
            {isFreePlan && <Lock size={14} className="text-red-500" title="Recurso Premium" />}
        </summary>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Nome do Template"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            disabled={isFreePlan}
          />
          <div className="w-full">
            <label htmlFor="thumb-upload" className={`w-full flex items-center justify-center gap-2 text-sm px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isFreePlan ? 'bg-gray-200 text-gray-500' : 'hover:bg-gray-100'}`}>
              <Upload size={16} />
              {newTemplateThumb ? 'Trocar Miniatura' : 'Enviar Miniatura'}
            </label>
            <input type="file" id="thumb-upload" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={isFreePlan} />
            {newTemplateThumb && (
              <div className="mt-2 relative w-24 h-24 rounded-md overflow-hidden border">
                <img src={newTemplateThumb} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setNewTemplateThumb(null)} className="absolute top-1 right-1 bg-white/70 rounded-full p-0.5 text-red-600 hover:bg-white" disabled={isFreePlan}>
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSaveTemplate}
            disabled={isFreePlan || !newTemplateName.trim() || !newTemplateThumb}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            Salvar Novo Template
          </button>
        </div>
      </details>

      {customTemplates.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Meus Templates Salvos
            {isFreePlan && <Lock size={14} className="text-red-500" title="Recurso Premium" />}
          </h3>
          <div className={`grid grid-cols-2 gap-3 ${isFreePlan ? 'opacity-50 pointer-events-none' : ''}`}>
            {customTemplates.map(template => (
              <TemplatePreview
                key={template.id}
                template={template}
                isCustom={true}
                onApply={() => applyCustomTemplate(template)}
                onDelete={() => handleDeleteClick(template.id)}
                isFreePlan={isFreePlan}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Galeria de Templates Prontos
            {isFreePlan && <Lock size={14} className="text-red-500" title="Recurso Premium" />}
        </h3>
        {loadingGlobalTemplates ? (
            <div className="flex justify-center items-center h-24">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        ) : (
            <div className={`grid grid-cols-2 gap-3 ${isFreePlan ? 'opacity-50 pointer-events-none' : ''}`}>
              {allReadyTemplates.map(template => (
                <TemplatePreview
                  key={template.id}
                  template={template}
                  isCustom={false}
                  onApply={() => applyPresetTemplate(template.theme)}
                  isFreePlan={isFreePlan}
                />
              ))}
            </div>
        )}
      </div>
      
      {/* Modal de Confirmação de Exclusão de Template */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão de Template"
        description="Tem certeza que deseja excluir este template de cabeçalho? Esta ação é irreversível."
        confirmText="Excluir Template"
        variant="danger"
      />
    </div>
  );
};

export default HeaderTemplatesTab;