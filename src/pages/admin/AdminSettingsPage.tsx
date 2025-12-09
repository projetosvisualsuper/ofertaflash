import React, { useState, useEffect } from 'react';
import { Settings, Key, ToggleLeft, ToggleRight, Loader2, Bell, Save, XCircle, Trash2 } from 'lucide-react';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';

const AdminSettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { settings, loading: loadingGlobalSettings, updateMaintenanceMode } = useGlobalSettings(isAdmin);

  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<{ id: string; message: string | string[] } | null>(null);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  
  const isMaintenanceEnabled = settings.maintenance_mode.enabled;

  const handleToggleMaintenance = () => {
    updateMaintenanceMode(!isMaintenanceEnabled);
  };
  
  // --- Lógica de Anúncios Globais ---
  
  const fetchActiveAnnouncement = async () => {
    setLoadingAnnouncement(true);
    const { data, error } = await supabase
      .from('global_announcements')
      .select('id, message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active announcement:', error);
    } else if (data) {
      setActiveAnnouncement(data);
      
      const messageToEdit = Array.isArray(data.message) 
        ? data.message.join('\n') 
        : (typeof data.message === 'string' ? data.message : '');
        
      setAnnouncementMessage(messageToEdit);
    } else {
      setActiveAnnouncement(null);
      setAnnouncementMessage('');
    }
    setLoadingAnnouncement(false);
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchActiveAnnouncement();
    }
  }, [isAdmin]);

  const handleSaveAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      showError("A mensagem do anúncio não pode ser vazia.");
      return;
    }
    
    setIsSavingAnnouncement(true);
    
    try {
      const lines = announcementMessage.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
      if (lines.length === 0) {
        showError("A mensagem do anúncio não pode ser vazia.");
        setIsSavingAnnouncement(false);
        return;
      }
      
      const { error: deactivateError } = await supabase
          .from('global_announcements')
          .update({ is_active: false })
          .eq('is_active', true)
          .select();
          
      if (deactivateError) console.warn("Warning: Failed to deactivate old announcements:", deactivateError);
      
      const { error } = await supabase
        .from('global_announcements')
        .insert({ message: lines, is_active: true });
        
      if (error) throw error;
      
      showSuccess("Novo anúncio global publicado com sucesso!");
      fetchActiveAnnouncement();
      
    } catch (error) {
      console.error("Error saving announcement:", error);
      showError("Falha ao publicar o anúncio.");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };
  
  const handleDeactivateAnnouncement = async () => {
    if (!activeAnnouncement) return;
    
    setIsSavingAnnouncement(true);
    
    try {
      const { error } = await supabase
        .from('global_announcements')
        .update({ is_active: false })
        .eq('id', activeAnnouncement.id)
        .select();
        
      if (error) throw error;
      
      showSuccess("Anúncio global desativado.");
      fetchActiveAnnouncement();
      
    } catch (error) {
      console.error("Error deactivating announcement:", error);
      showError("Falha ao desativar o anúncio.");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
        <p className="text-gray-500">Acesso negado. Apenas administradores podem ver esta página.</p>
      </div>
    );
  }

  // Prepara a mensagem ativa para exibição no painel
  const activeMessageDisplay = activeAnnouncement?.message 
    ? (Array.isArray(activeAnnouncement.message) ? activeAnnouncement.message.join(' | ') : activeAnnouncement.message)
    : 'Nenhum anúncio ativo.';

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações Gerais do Sistema
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
        
        {/* Modo Manutenção */}
        <div className="border-b pb-6">
          <h3 className="font-semibold text-lg mb-2">Modo Manutenção</h3>
          {loadingGlobalSettings ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className={`flex items-center justify-between p-4 rounded-md border transition-colors ${isMaintenanceEnabled ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
              <p className={`text-sm font-medium ${isMaintenanceEnabled ? 'text-red-800' : 'text-green-800'}`}>
                {isMaintenanceEnabled ? 'Modo Manutenção ATIVADO. Apenas admins podem acessar.' : 'Modo Manutenção DESATIVADO. Acesso normal.'}
              </p>
              <button 
                onClick={handleToggleMaintenance}
                className={`p-1 rounded-full transition-colors ${isMaintenanceEnabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                title={isMaintenanceEnabled ? "Desativar Manutenção" : "Ativar Manutenção"}
              >
                {isMaintenanceEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">Ativar esta opção restringe o acesso ao aplicativo apenas para usuários com o papel 'admin'.</p>
        </div>

        {/* Anúncios Globais */}
        <div className="border-b pb-6">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Bell size={20} className="text-yellow-600" /> Anúncios Globais
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Publique uma ou mais mensagens (uma por linha) que serão exibidas em rotação no banner superior.
          </p>
          
          {loadingAnnouncement ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          ) : activeAnnouncement ? (
            <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg space-y-3">
              <p className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                <Bell size={16} /> Anúncio Ativo:
              </p>
              <p className="text-sm text-gray-700 italic border-l-4 border-yellow-500 pl-3 whitespace-pre-wrap">
                {activeMessageDisplay}
              </p>
              <button
                onClick={handleDeactivateAnnouncement}
                disabled={isSavingAnnouncement}
                className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSavingAnnouncement ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Desativar Anúncio
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 p-2 border rounded-lg">Nenhum anúncio ativo no momento.</p>
          )}
          
          <div className="mt-4 space-y-3">
            <textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="Digite a nova mensagem de anúncio global aqui. Use ENTER para criar uma nova linha que será exibida em rotação."
              disabled={isSavingAnnouncement}
            />
            <button
              onClick={handleSaveAnnouncement}
              disabled={isSavingAnnouncement || !announcementMessage.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSavingAnnouncement ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Publicar Novo Anúncio
            </button>
          </div>
        </div>
        
        {/* Integrações de Pagamento (Mantido) */}
        <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Key size={20} className="text-blue-600" /> Integrações de Pagamento
            </h3>
            <p className="text-sm text-gray-600">Instruções para Mercado Pago e Asaas (em breve).</p>
            {/* Conteúdo de Integrações de Pagamento (Omitido para brevidade, mas estaria aqui) */}
        </div>
        
        {/* Outras Configurações (Mantido) */}
        <div className="pt-6">
            <p className="text-gray-500">Outras configurações...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;