import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, Zap, Loader2 } from 'lucide-react';
import { useWooCommerceProducts } from '../hooks/useWooCommerceProducts';
import { WooProduct } from '../../types';

const ROTATION_INTERVAL_MS = 5000; // 5 segundos por produto

// Função auxiliar para randomizar um array
const shuffleArray = (array: WooProduct[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const CarouselCard: React.FC<{ product: WooProduct }> = ({ product }) => {
    // Garante que o preço seja um número e formatado para 2 casas decimais
    const rawPrice = parseFloat(product.sale_price || product.regular_price || product.price);
    const priceFormatted = isNaN(rawPrice) ? '0.00' : rawPrice.toFixed(2).replace('.', ',');
    
    const rawRegularPrice = parseFloat(product.regular_price || product.price);
    const regularPriceFormatted = isNaN(rawRegularPrice) ? '0.00' : rawRegularPrice.toFixed(2).replace('.', ',');
    
    const isSale = !!product.sale_price && product.sale_price !== product.regular_price;
    
    return (
        <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-indigo-500/50 flex flex-col items-center text-center h-full transition-all duration-500 animate-fade-in">
            <div className="w-full h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 mb-2 relative">
                {product.image_url ? (
                    <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain" 
                    />
                ) : (
                    <ShoppingCart size={24} className="text-gray-400" />
                )}
                {isSale && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-bl-lg">
                        OFERTA
                    </span>
                )}
            </div>
            
            {/* Removendo mb-1 */}
            <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
            
            {/* Removendo pt-2 */}
            <div className="mt-auto w-full"> 
                {isSale && (
                    <p className="text-xs text-gray-500 line-through leading-none">De R$ {regularPriceFormatted}</p>
                )}
                <p className="text-xl font-black text-green-600 leading-tight">R$ {priceFormatted}</p>
            </div>
        </div>
    );
};

const WooCommerceCarousel: React.FC = () => {
  const { products, loading, error } = useWooCommerceProducts();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Filtra produtos válidos e randomiza a lista
  const carouselProducts = useMemo(() => {
    const validProducts = products.filter(p => p.price && p.name);
    // Randomiza a lista de produtos válidos
    return shuffleArray([...validProducts]); 
  }, [products]);
  
  const totalProducts = carouselProducts.length;

  // Lógica de Carrossel Automático
  useEffect(() => {
    if (totalProducts > 1) {
      const timer = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % totalProducts);
      }, ROTATION_INTERVAL_MS);
      return () => clearInterval(timer);
    }
  }, [totalProducts]);

  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % totalProducts);
  };

  const handlePrev = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + totalProducts) % totalProducts);
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl shadow-inner text-center h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
      </div>
    );
  }
  
  // Se houver erro, o carrossel deve mostrar a mensagem de "Sem produtos"
  if (error || totalProducts === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl shadow-inner text-center h-full flex items-center justify-center flex-col">
        <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
        <p className="text-xs text-gray-500">Sem produtos em destaque.</p>
      </div>
    );
  }
  
  const currentProduct = carouselProducts[currentIndex];

  return (
    <div className="p-2 bg-indigo-50 rounded-xl shadow-lg space-y-2 flex flex-col h-full">
      <h3 className="text-xs font-bold text-indigo-800 flex items-center gap-1 px-2 pt-1">
        <Zap size={14} /> Destaques Aleatórios
      </h3>
      
      <div className="flex-1 relative min-h-[150px]">
        {/* O Card do Produto - Usando a chave do produto para forçar a animação de transição */}
        <CarouselCard key={currentProduct.id} product={currentProduct} />
      </div>
      
      {/* Controles de Navegação */}
      {totalProducts > 1 && (
        <div className="flex justify-between items-center px-2 pb-1">
          <button onClick={handlePrev} className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors">
            <ChevronLeft size={16} className="text-indigo-600" />
          </button>
          <span className="text-xs text-indigo-700">
            {currentIndex + 1} / {totalProducts}
          </span>
          <button onClick={handleNext} className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors">
            <ChevronRight size={16} className="text-indigo-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WooCommerceCarousel;