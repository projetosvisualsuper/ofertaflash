import React, { useState, useEffect } from 'react';
import { PosterTheme, CompanyInfo, LogoLayout } from '../../types';
import { Building, Edit, Image as ImageIcon, Trash2, Loader2, Check, X, Lock } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } => '../utils/toast';
import { useAuth } from '../context/AuthContext';

interface CompanyInfoPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
}

// Helper function to create layouts for all formats
const createInitialLogoLayouts = (): Record<string, LogoLayout> => ({
    'story': { scale: 1, x: 0, y: 0 },
    'feed': { scale: 1, x: 0, y: 0 },
    'a4': { scale: 1, x: 0, y: 0 },
    'landscape-poster': { scale: 1, x: 0, y: 0 },
    'tv': { scale: 1, x: 0, y: 0 },
});

// Componente para o toggle de exibição
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" disabled={disabled} />
    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
    <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
  </label>
);

const CompanyInfoPage: React.FC<CompanyInfoPageProps> = ({ theme, setTheme }) => {
  const { profile } = useAuth();
  const isFreePlan = profile?.role === 'free';
  const isEditingAllowed = !isFreePlan; // Permite edição de texto e toggles apenas para Premium/Pro

  const [isUploading, setIsUploading] = useState(false);
  
  // Inicializa o estado local com o valor do tema
  const [localCompanyInfo, setLocalCompanyInfo] = useState<CompanyInfo>(theme.companyInfo || {});

  // Sincroniza o estado local quando o tema muda (ex: ao carregar do Supabase)
  useEffect(() => {
    if (theme.companyInfo) {
      setLocalCompanyInfo(theme.companyInfo);
    }
  }, [theme.companyInfo]);

  if (!theme.companyInfo) return null;

  const handleInfoChange = (field: keyof CompanyInfo, value: string | boolean) => {
    if (!isEditingAllowed) {
        showError("Edição de informações da empresa é exclusiva para planos Premium e Pro.");
        return;
    }
    const updatedInfo = { ...localCompanyInfo, [field]: value };
    setLocalCompanyInfo(updatedInfo);
    
    // Salva imediatamente no tema (que por sua vez salva no Supabase via useUserSettings)
    setTheme(prev => ({
      ...prev,
      companyInfo: updatedInfo,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!file || !userId) {
      showError("Erro: Usuário não autenticado ou arquivo não selecionado.");
      return;
    }
    
    setIsUploading(true);
    // Usamos um nome de arquivo único para evitar problemas de cache
    const filePath = `${userId}/logo-${crypto.randomUUID()}.${file.name.split('.').pop()}`;

    try {
      // 1. Deletar logo antigo se existir (opcional, mas limpa o storage)
      if (theme.logo?.path) {
        // Não precisamos esperar o delete, apenas tentamos
        supabase.storage.from('logos').remove([theme.logo.path]).catch(err => console.warn("Failed to remove old logo:", err));
      }
      
      // 2. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) throw new Error("Falha ao obter URL pública.");
      
      console.log("Nova URL da Logo:", urlData.publicUrl); // Log para debug

      // 4. Atualizar o tema com a nova URL e layouts
      setTheme(prev => ({
        ...prev,
        logo: {
          src: urlData.publicUrl,
          layouts: prev.logo?.layouts || createInitialLogoLayouts(), // Mantém layouts existentes ou cria novos
          path: filePath, // Salva o path para facilitar a remoção
        },
        headerLayoutId: prev.headerLayoutId === 'text-only' ? 'logo-left' : prev.headerLayoutId,
      }));
      
      showSuccess("Logo enviado com sucesso!");

    } catch (error) {
      console.error("Erro no upload do logo:", error);
      showError("Falha ao enviar o logo. Verifique as permissões do Storage e se o bucket 'logos' existe.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!theme.logo || !theme.logo.path) return;
    
    setIsUploading(true);
    try {
      // 1. Deletar do Storage
      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([theme.logo.path]);

      if (deleteError) throw deleteError;

      // 2. Remover do tema
      setTheme(prev => ({
        ...prev,
        logo: undefined,
        headerLayoutId: 'text-only',
      }));
      
      showSuccess("Logo removido com sucesso!");

    } catch (error) {
      console.error("Erro ao remover logo:", error);
      showError("Falha ao remover o logo do Storage.");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Adiciona um timestamp para forçar o cache-busting
  const logoSrcWithCacheBust = theme.logo?.src 
    ? `${theme.logo.src}?t=${new Date().getTime()}` 
    : undefined;

  const fields: { label: string; field: keyof CompanyInfo; isTextarea?: boolean }[] = [
    { label: 'Nome da Empresa', field: 'name' },
    { label: 'Slogan', field: 'slogan' },
    { label: 'Telefone', field: 'phone' },
    { label: 'Whatsapp', field: 'whatsapp' },
    { label: 'Legenda dos Telefones', field: 'phonesLegend' },
    { label: 'Formas de Pagamento', field: 'paymentMethods', isTextarea: true },
    { label: 'Obs. Pagamento', field: 'paymentNotes' },
    { label: 'Endereço', field: 'address', isTextarea: true },
    { label: 'Instagram', field: 'instagram' },
    { label: 'Facebook', field: 'facebook' },
    { label: 'Website', field: 'website' },
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Building size={32} className="text-indigo-600" />
        Dados da Empresa
      </h2>
      
      <div className="max-w-3xl w-full mx-auto bg-white p-6 rounded-xl shadow-md space-y-8">
        
        {/* Seção 1: Logo (Permitido para Free) */}
        <div className="space-y-4 border-b pb-6">
            <h3 className="text-xl font-semibold text-gray-800">Logo da Empresa</h3>
            <div className="p-4 bg-gray-50 rounded-lg border flex items-center gap-6">
              <div className="w-28 h-28 bg-white border-2 border-dashed rounded-md flex items-center justify-center shrink-0 overflow-hidden relative">
                {isUploading ? (
                    <Loader2 size={32} className="text-indigo-500 animate-spin" />
                ) : logoSrcWithCacheBust ? (
                  <img 
                    src={logoSrcWithCacheBust} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain" 
                    // A key é importante para forçar a re-renderização no PosterHeader
                    key={theme.logo?.src} 
                  />
                ) : (
                  <ImageIcon size={32} className="text-gray-400" />
                )}
              </div>
              <div className="space-y-2">
                <input type="file" id="logo-upload-company" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
                <label htmlFor="logo-upload-company" className={`inline-block px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer ${isUploading ? 'bg-gray-400 text-gray-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                  {isUploading ? 'Enviando...' : theme.logo ? 'Trocar Logo' : 'Enviar Logo'}
                </label>
                {theme.logo && (
                  <button onClick={removeLogo} disabled={isUploading} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 ml-1 disabled:opacity-50">
                    <Trash2 size={14} />
                    Remover
                  </button>
                )}
                <p className="text-xs text-gray-500">Use uma imagem com fundo transparente (PNG) para melhores resultados.</p>
              </div>
            </div>
        </div>

        {/* Seção 2: Informações de Contato e Rodapé (Bloqueado para Free) */}
        <div className={`space-y-4 ${isFreePlan ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                Informações de Contato e Rodapé
                {isFreePlan && <Lock size={18} className="text-red-500" title="Recurso Premium" />}
            </h3>
            <p className="text-sm text-gray-500">
              Preencha os dados e use o toggle para controlar quais informações aparecem no rodapé dos seus cartazes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(({ label, field, isTextarea }) => {
                const toggleField = `show${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof CompanyInfo;
                const value = (localCompanyInfo[field] as string) || '';
                const isChecked = !!localCompanyInfo[toggleField];

                return (
                  <div key={field} className="p-4 border rounded-lg bg-gray-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-gray-700">{label}</label>
                      <ToggleSwitch 
                        label={isChecked ? 'Exibindo' : 'Oculto'}
                        checked={isChecked}
                        onChange={(e) => handleInfoChange(toggleField, e.target.checked)}
                        disabled={!isEditingAllowed}
                      />
                    </div>
                    
                    {isTextarea ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleInfoChange(field, e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:bg-gray-100"
                        rows={2}
                        placeholder={`Insira o(a) ${label.toLowerCase()}`}
                        disabled={!isEditingAllowed}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleInfoChange(field, e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                        placeholder={`Insira o(a) ${label.toLowerCase()}`}
                        disabled={!isEditingAllowed}
                      />
                    )}
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;