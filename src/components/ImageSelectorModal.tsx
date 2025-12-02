import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Image as ImageIcon, Search, Loader2, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProductImages, ProductImage } from '../hooks/useProductImages';
import { showSuccess } from '../utils/toast';
import ConfirmationModal from './ConfirmationModal';

interface ImageSelectorModalProps {
  trigger: React.ReactNode;
  onSelectImage: (url: string) => void;
}

const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({ trigger, onSelectImage }) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { productImages, loadingImages, deleteImage, fetchImages } = useProductImages(userId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredImages = useMemo(() => {
    if (!searchTerm) return productImages;
    return productImages.filter(img => 
      img.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productImages, searchTerm]);
  
  const handleSelect = () => {
    if (selectedImage) {
      onSelectImage(selectedImage.url);
      showSuccess(`Imagem "${selectedImage.name}" selecionada.`);
      setIsOpen(false);
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
    setSelectedImage(null); // Desseleciona se for a imagem ativa
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[800px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon size={24} /> Banco de Imagens de Produtos
            </DialogTitle>
            <DialogDescription>
              Reutilize imagens geradas por IA ou enviadas anteriormente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome do arquivo..."
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
                <ImageIcon size={32} className="mx-auto mb-2" />
                <p>Nenhuma imagem encontrada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {filteredImages.map(image => (
                  <div 
                    key={image.path} 
                    className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all border-4 ${selectedImage?.path === image.path ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name} 
                      className="w-full h-24 object-contain bg-white"
                    />
                    <div className="p-1 text-xs text-center bg-gray-50 truncate">{image.name.substring(0, 20)}...</div>
                    
                    {selectedImage?.path === image.path && (
                      <Check size={20} className="absolute top-1 left-1 text-white bg-indigo-600 rounded-full p-0.5" />
                    )}
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(image); }}
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
          
          <DialogFooter className="mt-4 flex justify-between items-center">
            <DialogClose asChild>
              <button className="px-4 py-2 rounded-lg text-sm font-medium border bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
            </DialogClose>
            <button
              onClick={handleSelect}
              disabled={!selectedImage}
              className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              <Check size={16} />
              Selecionar Imagem
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão de Imagem"
        description={`Tem certeza que deseja excluir a imagem "${imageToDelete?.name}"? Esta ação é irreversível e a imagem será removida do seu banco de imagens.`}
        confirmText="Excluir Permanentemente"
        isConfirming={isDeleting}
        variant="danger"
      />
    </>
  );
};

export default ImageSelectorModal;