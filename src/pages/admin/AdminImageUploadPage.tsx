import React, { useState, useCallback } from 'react';
import { Image, Upload, Loader2, Trash2, Search, Check, Save } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';
import { useProductImages, ProductImage } from '../../hooks/useProductImages';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

// Constantes de Limite
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Função auxiliar para sanitizar o nome do arquivo
const sanitizeFileName = (fileName: string) => {
    const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
    const safeName = nameWithoutExt.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const fileExtension = fileName.split('.').pop();
    return `${safeName}.${fileExtension}`;
};

const AdminImageUploadPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  // Usamos um ID fixo para buscar o diretório público/compartilhado
  const PUBLIC_IMAGE_DIR = 'shared'; 
  const { productImages, loadingImages, deleteImage, fetchImages } = useProductImages(PUBLIC_IMAGE_DIR);
  
  const [imageName, setImageName] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showError(`O arquivo é muito grande. O limite é de ${MAX_FILE_SIZE_MB}MB.`);
        setFileToUpload(null);
        return;
      }
      setFileToUpload(file);
      // Sugere o nome do arquivo como nome do produto
      setImageName(file.name.split('.').slice(0, -1).join('.'));
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload || !imageName.trim() || !isAdmin) {
      showError("Preencha o nome e selecione um arquivo.");
      return;
    }

    setIsUploading(true);
    
    // 1. Criar um nome de arquivo seguro baseado no nome original do arquivo
    const safeFileName = sanitizeFileName(fileToUpload.name);
    // O caminho agora é determinístico: shared/nome-do-arquivo-original.ext
    const filePath = `${PUBLIC_IMAGE_DIR}/${safeFileName}`;

    try {
      // 2. Upload para o Storage (no diretório 'shared')
      // Usamos upsert: true para sobrescrever se o arquivo com o mesmo nome já existir.
      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true, // Sobrescreve se o nome for o mesmo
        });

      if (uploadError) throw uploadError;
      
      showSuccess(`Imagem "${imageName}" cadastrada com sucesso no banco compartilhado!`);
      
      // 3. Limpar e recarregar
      setImageName('');
      setFileToUpload(null);
      fetchImages();

    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      showError("Falha ao enviar a imagem. Verifique o console.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteClick = (image: ProductImage) => {
    setImageToDelete(image);
    setIsConfirmDeleteOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;
    
    setIsDeleting(true);
    await deleteImage(imageToDelete.path);
    setIsDeleting(false);
    setIsConfirmDeleteOpen(false);
    setImageToDelete(null);
  };

  const filteredImages = productImages.filter(img => 
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-500">Acesso negado.</div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Image size={32} className="text-indigo-600" />
        Banco de Imagens Compartilhado
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna de Upload */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Cadastrar Nova Imagem</h3>
          
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nome do Produto/Imagem</label>
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Picanha Friboi"
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Arquivo de Imagem</label>
            <input type="file" id="admin-image-upload" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
            <label htmlFor="admin-image-upload" className={`w-full flex items-center justify-center gap-2 text-sm py-2 px-3 border rounded-lg cursor-pointer transition-colors ${isUploading ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-50'}`}>
              <Upload size={16} />
              {fileToUpload ? fileToUpload.name : 'Selecionar Arquivo'}
            </label>
            {fileToUpload && (
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md">
                <img src={URL.createObjectURL(fileToUpload)} alt="Preview" className="max-h-24 object-contain" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Limite de arquivo: {MAX_FILE_SIZE_MB}MB. Recomendamos imagens com alta resolução (mínimo 2000px) para impressão.</p>
          
          <button
            onClick={handleUpload}
            disabled={isUploading || !fileToUpload || !imageName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isUploading ? 'Enviando...' : 'Salvar no Banco Compartilhado'}
          </button>
        </div>
        
        {/* Coluna de Visualização */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Imagens Compartilhadas ({productImages.length})</h3>
          
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar imagem por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          {loadingImages ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="ml-4 text-gray-600">Carregando imagens...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500">
              <Image size={32} className="mx-auto mb-2" />
              <p>Nenhuma imagem compartilhada encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
              {filteredImages.map(image => (
                <div 
                  key={image.path} 
                  className="relative group rounded-lg overflow-hidden transition-all border border-gray-200 hover:border-indigo-500"
                >
                  <img 
                    src={image.url} 
                    alt={image.name} 
                    className="w-full h-24 object-contain bg-white"
                  />
                  <div className="p-1 text-xs text-center bg-gray-50 truncate">{image.name.split('.')[0]}</div>
                  
                  <button
                    onClick={() => handleDeleteClick(image)}
                    className="absolute top-1 right-1 p-1 text-red-500 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="Excluir Imagem"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão de Imagem"
        description={`Tem certeza que deseja excluir a imagem "${imageToDelete?.name}"? Esta imagem será removida do banco de imagens COMPARTILHADO.`}
        confirmText="Excluir Permanentemente"
        isConfirming={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default AdminImageUploadPage;