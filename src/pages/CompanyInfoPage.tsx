import React from 'react';
import { PosterTheme, CompanyInfo } from '../../types';
import { Building, Edit } from 'lucide-react';

interface CompanyInfoPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
}

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
            <h3 className="text-lg font-semibold text-gray-800">Informações do Rodapé</h3>
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