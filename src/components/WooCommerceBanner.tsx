import React from 'react';
import { ShoppingCart, Loader2, ExternalLink, AlertTriangle, Settings } from 'lucide-react';
import { useWooCommerceProducts } from '../hooks/useWooCommerceProducts';
import { WooProduct } from '../../types';

const ProductCard: React.FC<{ product: WooProduct }> = ({ product }) => {
    // Garante que o preço seja um número e formatado para 2 casas decimais
    const rawPrice = parseFloat(product.sale_price || product.regular_price || product.price);
    const priceFormatted = isNaN(rawPrice) ? '0.00' : rawPrice.toFixed(2).replace('.', ',');
    
    const rawRegularPrice = parseFloat(product.regular_price || product.price);
    const regularPriceFormatted = isNaN(rawRegularPrice) ? '0.00' : rawRegularPrice.toFixed(2).replace('.', ',');
    
    const isSale = !!product.sale_price && product.sale_price !== product.regular_price;
    
    return (
        <a 
            href={product.permalink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-indigo-400"
        >
            <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center shrink-0 mr-2">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                    <ShoppingCart size={14} className="text-gray-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                {/* Reduzindo o tamanho da fonte para caber */}
                <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">{product.name}</p>
                <div className="flex items-center mt-0.5 leading-none">
                    {isSale && (
                        <span className="text-[10px] text-red-500 line-through mr-1">R$ {regularPriceFormatted}</span>
                    )}
                    {/* Preço principal em destaque */}
                    <span className="text-sm font-bold text-green-600 whitespace-nowrap">R$ {priceFormatted}</span>
                </div>
            </div>
            <ExternalLink size={12} className="text-gray-400 ml-1 shrink-0" />
        </a>
    );
};

const WooCommerceBanner: React.FC = () => {
  const { products, loading, error } = useWooCommerceProducts();

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl shadow-inner text-center">
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-600">Buscando ofertas do WooCommerce...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl shadow-inner border border-red-200">
        <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-semibold text-red-800">Erro de Integração</p>
        </div>
        <p className="text-xs text-red-700 mb-2">{error}</p>
        <a href="#" onClick={() => window.location.href = '#settings'} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1">
            <Settings size={12} /> Configurar Chaves
        </a>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl shadow-inner text-center">
        <ShoppingCart className="w-5 h-5 text-gray-400 mx-auto mb-1" />
        <p className="text-xs text-gray-500">Nenhuma oferta do WooCommerce encontrada.</p>
      </div>
    );
  }

  return (
    <div className="p-2 bg-indigo-50 rounded-xl shadow-lg space-y-2">
      <h3 className="text-xs font-bold text-indigo-800 flex items-center gap-1 px-2 pt-1">
        <ShoppingCart size={14} /> Oportunidades
      </h3>
      <p className="text-[10px] text-indigo-700 text-center px-2">
        Transforme suas ofertas em vendas — veja nossos produtos para comunicação!
      </p>
      <div className="space-y-2">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default WooCommerceBanner;