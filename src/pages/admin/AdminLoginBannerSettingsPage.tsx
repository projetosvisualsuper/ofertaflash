import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, List, Trash2, Plus, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLoginBannerSettings, LoginBannerSettings } from '../../hooks/useLoginBannerSettings';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';

const AdminLoginBannerSettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { settings, loading: loadingSettings } = useLoginBannerSettings();
  
  const [localSettings, setLocalSettings] = useState<LoginBannerSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...localSettings.features];
    newFeatures[index] = value;
    setLocalSettings(prev => ({ ...prev, features: newFeatures }));
  };

  const handleAddFeature = () => {
    setLocalSettings(prev => ({ ...prev, features: [...prev.features, 'Novo Recurso'] }));
  };

  const handleRemoveFeature = (index: number) => {
    setLocalSettings(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!isAdmin) {
      showError("Apenas administradores podem salvar estas configurações.");
      return;
    }
    if (!localSettings.title.trim()) {
      showError("O título é obrigatório.");
      return;
    }
    
    setIsSaving(true);
    
    // 1. Buscar o ID do registro existente (se houver)
    const { data: existingData, error: fetchError } = await supabase
      .from('login_banner_settings')
      .select('id')
      .limit(1)
      .single();
      
    // Ignoramos PGRST116 (No rows found)
    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing ID:', fetchError);
        showError('Falha ao buscar ID de configuração.');
        setIsSaving(false);
        return;
    }
    
    const idToUpdate = existingData?.id;
    
    const dataToSave = {
        title: localSettings.title,
        subtitle: localSettings.subtitle,
        features: localSettings.features.filter(f => f.trim().length > 0), // Filtra recursos vazios
        bannerColor: localSettings.bannerColor,
        updated_at: new Date().toISOString(),
    };

    let saveError = null;

    if (idToUpdate) {
        // 2. Se o ID existir, fazemos um UPDATE
        const { error } = await supabase
            .from('login_banner_settings')
            .update(dataToSave)
            .eq('id', idToUpdate);
        saveError = error;
    } else {
        // 3. Se o ID não existir, fazemos um INSERT
        // Geramos o ID no cliente para garantir que não seja nulo
        const insertData = {
            ...dataToSave,
            id: crypto.randomUUID(), // Gerando UUID no cliente
        };
        
        const { error } = await supabase
            .from('login_banner_settings')
            .insert(insertData);
        saveError = error;
    }

    setIsSaving(false);

    if (saveError) {
      console.error('Error saving login banner settings:', saveError);
      showError('Falha ao salvar configurações do banner.');
    } else {
      showSuccess('Configurações do banner de login salvas com sucesso!');
      // Força o recarregamento para garantir que o hook useLoginBannerSettings pegue o novo ID
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-500">Acesso negado.</div>
    );
  }

  if (loadingSettings) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="ml-4 text-gray-600">Carregando configurações do banner...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações do Banner de Login
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6 max-w-3xl">
        
        {/* Título e Subtítulo */}
        <div className="space-y-4 border-b pb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Título Principal (Ex: Sistema de Agendamento)</label>
            <input
              type="text"
              value={localSettings.title}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Subtítulo / Descrição</label>
            <textarea
              value={localSettings.subtitle}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              disabled={isSaving}
            />
          </div>
        </div>
        
        {/* Cor do Banner */}
        <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Palette size={20} className="text-indigo-600" /> Cor do Banner
            </h3>
            <div className="flex items-center gap-4">
                <input
                    type="color"
                    value={localSettings.bannerColor}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, bannerColor: e.target.value }))}
                    className="w-16 h-16 border rounded-lg cursor-pointer"
                    disabled={isSaving}
                />
                <input
                    type="text"
                    value={localSettings.bannerColor}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, bannerColor: e.target.value }))}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="#RRGGBB"
                    disabled={isSaving}
                />
            </div>
        </div>
        
        {/* Lista de Recursos */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <List size={20} className="text-indigo-600" /> Recursos em Destaque
          </h3>
          
          <div className="space-y-2">
            {localSettings.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Recurso em destaque"
                  disabled={isSaving}
                />
                <button
                  onClick={() => handleRemoveFeature(index)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                  title="Remover Recurso"
                  disabled={isSaving}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleAddFeature}
            className="flex items-center gap-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <Plus size={16} /> Adicionar Recurso
          </button>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving || !localSettings.title.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginBannerSettingsPage;