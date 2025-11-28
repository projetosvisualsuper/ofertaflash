import React, { useState } from 'react';
import { PosterTheme, HeaderTemplate } from '../../types';
import { HEADER_TEMPLATE_PRESETS } from '../config/headerTemplatePresets';
import { Save, Trash2, Upload, XCircle } from 'lucide-react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

interface HeaderTemplatesTabProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
}

const HeaderTemplatesTab: React.FC<HeaderTemplatesTabProps> = ({ theme, setTheme }) => {
  const [customTemplates, setCustomTemplates] = useLocalStorageState<HeaderTemplate[]>('ofertaflash_custom_header_templates', []);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateThumb, setNewTemplateThumb] = useState<string | null>(null);

  // For applying default templates from the gallery
  const applyPresetTemplate = (templateTheme: Partial<PosterTheme>) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      ...templateTheme,
      // Explicitly reset header image unless the preset provides one.
      // This fixes the bug where the header would be blank after switching from a custom template.
      headerImage: templateTheme.headerImage || undefined,
      headerImageMode: templateTheme.headerImageMode || 'none',
    }));
  };

  // For applying user-saved custom templates
  const applyCustomTemplate = (template: HeaderTemplate) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      ...template.theme,
      headerImage: template.thumbnail, // Use the thumbnail as the hero image
      headerImageMode: 'hero',
      useLogoOnHero: false, // Default to not showing logo over image
    }));
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

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateThumb) {
      alert("Por favor, forneça um nome e uma imagem para o template.");
      return;
    }

    const themeToSave: Partial<PosterTheme> = {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      headerTextColor: theme.headerTextColor,
      fontFamilyDisplay: theme.fontFamilyDisplay,
      headerArtStyleId: theme.headerArtStyleId,
      headerTitleCase: theme.headerTitleCase,
      headerLayoutId: theme.headerLayoutId,
      headerImage: theme.headerImage,
      headerImageMode: theme.headerImageMode,
      useLogoOnHero: theme.useLogoOnHero,
      headerImageOpacity: theme.headerImageOpacity,
      logo: theme.logo,
      headerElements: theme.headerElements,
    };

    const newTemplate: HeaderTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName.trim(),
      thumbnail: newTemplateThumb,
      theme: themeToSave,
    };

    setCustomTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName('');
    setNewTemplateThumb(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este template?")) {
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <details className="p-3 bg-gray-50 rounded-lg border" open>
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer">Salvar Cabeçalho Atual</summary>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Nome do Template"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <div className="w-full">
            <label htmlFor="thumb-upload" className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload size={16} />
              {newTemplateThumb ? 'Trocar Miniatura' : 'Enviar Miniatura'}
            </label>
            <input type="file" id="thumb-upload" accept="image/*" className="hidden" onChange={handleThumbUpload} />
            {newTemplateThumb && (
              <div className="mt-2 relative w-24 h-24 rounded-md overflow-hidden border">
                <img src={newTemplateThumb} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setNewTemplateThumb(null)} className="absolute top-1 right-1 bg-white/70 rounded-full p-0.5 text-red-600 hover:bg-white">
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSaveTemplate}
            disabled={!newTemplateName.trim() || !newTemplateThumb}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            Salvar Novo Template
          </button>
        </div>
      </details>

      {customTemplates.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Meus Templates Salvos</h3>
          <div className="grid grid-cols-2 gap-3">
            {customTemplates.map(template => (
              <div key={template.id} className="relative group">
                <button
                  onClick={() => applyCustomTemplate(template)}
                  className="w-full border rounded-lg overflow-hidden bg-white hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500 transition-all"
                >
                  <img src={template.thumbnail} alt={template.name} className="w-full h-24 object-cover" />
                  <div className="p-2 text-center">
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-700 truncate">{template.name}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="absolute top-0 right-0 p-1 text-red-500 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 shadow-md"
                  title="Excluir Template"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700">Galeria de Templates Prontos</h3>
        <div className="grid grid-cols-2 gap-3">
          {HEADER_TEMPLATE_PRESETS.map(template => (
            <button
              key={template.id}
              onClick={() => applyPresetTemplate(template.theme)}
              className="border rounded-lg overflow-hidden group bg-white hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500 transition-all"
            >
              <img src={template.thumbnail} alt={template.name} className="w-full h-24 object-cover bg-gray-200" />
              <div className="p-2 text-center">
                <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-700">{template.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeaderTemplatesTab;