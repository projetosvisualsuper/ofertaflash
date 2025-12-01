import React from 'react';
import { PosterTheme, CompanyInfo, LogoLayout } from '../../types';
import { Building, Edit, Image as ImageIcon, Trash2 } from 'lucide-react';

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


const InfoRow: React.FC<{
  label: string;
  field: keyof CompanyInfo;
  toggleField: keyof CompanyInfo;
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  isTextarea?: boolean;
}> = ({ label, field, toggleField, theme, setTheme, isTextarea = false }) => {
  const companyInfo = theme.companyInfo || {};
  
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(prev => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, [toggleField]: e.target.checked },
    }));
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTheme(prev => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, [field]: e.target.value },
    }));
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={!!companyInfo[toggleField]} onChange={handleToggle} className="sr-only peer" />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <details className="relative">
        <summary className="p-1 text-gray-500 hover:text-indigo-600 cursor-pointer list-none">
          <Edit size={16} />
        </summary>
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-lg shadow-xl p-3 z-20 space-y-2">
          <label className="text-xs font-semibold text-gray-600 block">{label}</label>
          {isTextarea ? (
            <textarea
              value={(companyInfo[field] as string) || ''}
              onChange={handleValueChange}
              className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
            />
          ) : (
            <input
              type="text"
              value={(companyInfo[field] as string) || ''}
              onChange={handleValueChange}
              className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          )}
        </div>
      </details>
    </div>
  );
};

const CompanyInfoPage: React.FC<CompanyInfoPageProps> = ({ theme, setTheme }) => {
  if (!theme.companyInfo) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTheme(prev => ({
          ...prev,
          logo: {
            src: reader.result as string,
            layouts: createInitialLogoLayouts(), 
          },
          headerLayoutId: prev.headerLayoutId === 'text-only' ? 'logo-left' : prev.headerLayoutId,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setTheme(prev => ({
      ...prev,
      logo: undefined,
      headerLayoutId: 'text-only',
    }));
  };

  const fields: { label: string; field: keyof CompanyInfo; toggleField: keyof CompanyInfo; isTextarea?: boolean }[] = [
    { label: 'Nome da Empresa', field: 'name', toggleField: 'showName' },
    { label: 'Slogan', field: 'slogan', toggleField: 'showSlogan' },
    { label: 'Telefone', field: 'phone', toggleField: 'showPhone' },
    { label: 'Whatsapp', field: 'whatsapp', toggleField: 'showWhatsapp' },
    { label: 'Legenda dos Telefones', field: 'phonesLegend', toggleField: 'showPhonesLegend' },
    { label: 'Formas de Pagamento', field: 'paymentMethods', toggleField: 'showPaymentMethods', isTextarea: true },
    { label: 'Obs. Pagamento', field: 'paymentNotes', toggleField: 'showPaymentNotes' },
    { label: 'Endereço', field: 'address', toggleField: 'showAddress', isTextarea: true },
    { label: 'Instagram', field: 'instagram', toggleField: 'showInstagram' },
    { label: 'Facebook', field: 'facebook', toggleField: 'showFacebook' },
    { label: 'Website', field: 'website', toggleField: 'showWebsite' },
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Building size={32} className="text-indigo-600" />
        Dados da Empresa
      </h2>
      
      <div className="max-w-2xl w-full mx-auto bg-white p-6 rounded-xl shadow-md space-y-6">
        
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Logo da Empresa</h3>
            <div className="p-4 bg-gray-50 rounded-lg border flex items-center gap-4">
              <div className="w-24 h-24 bg-white border-2 border-dashed rounded-md flex items-center justify-center shrink-0">
                {theme.logo ? (
                  <img src={theme.logo.src} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon size={32} className="text-gray-400" />
                )}
              </div>
              <div className="space-y-2">
                <input type="file" id="logo-upload-company" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <label htmlFor="logo-upload-company" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer">
                  {theme.logo ? 'Trocar Logo' : 'Enviar Logo'}
                </label>
                {theme.logo && (
                  <button onClick={removeLogo} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 ml-1">
                    <Trash2 size={14} />
                    Remover
                  </button>
                )}
                <p className="text-xs text-gray-500">Use uma imagem com fundo transparente (PNG) para melhores resultados.</p>
              </div>
            </div>
        </div>

        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-t pt-6">Informações do Rodapé</h3>
            <p className="text-sm text-gray-500">
              Ative e edite as informações que devem aparecer no rodapé dos seus cartazes e artes.
            </p>
            <div className="space-y-2">
              {fields.map(f => (
                <InfoRow key={f.field} {...f} theme={theme} setTheme={setTheme} />
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;