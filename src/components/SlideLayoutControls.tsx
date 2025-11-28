import React from 'react';
import { Product, ProductLayout } from '../../types';
import { SlidersHorizontal } from 'lucide-react';

interface SlideLayoutControlsProps {
  product: Product;
  onLayoutChange: (productId: string, newLayout: ProductLayout) => void;
}

const defaultLayout: ProductLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const SlideLayoutControls: React.FC<SlideLayoutControlsProps> = ({ product, onLayoutChange }) => {
  const layout = product.tvLayout || defaultLayout;

  const handleChange = (element: keyof ProductLayout, property: 'x' | 'y' | 'scale', value: number) => {
    const newLayout: ProductLayout = {
      ...layout,
      [element]: {
        ...layout[element],
        [property]: value,
      },
    };
    onLayoutChange(product.id, newLayout);
  };

  const renderControlGroup = (element: keyof ProductLayout, title: string) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 mt-3">
      <h4 className="col-span-2 text-xs font-bold uppercase text-gray-500">{title}</h4>
      <div className="space-y-1 col-span-2">
        <div className="flex justify-between text-xs">
          <label className="font-medium text-gray-600">Tamanho</label>
          <span className="font-mono text-gray-500">{layout[element].scale.toFixed(1)}x</span>
        </div>
        <input type="range" min="0.5" max="2" step="0.1" value={layout[element].scale} onChange={(e) => handleChange(element, 'scale', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label className="font-medium text-gray-600">Posição X</label>
          <span className="font-mono text-gray-500">{layout[element].x}px</span>
        </div>
        <input type="range" min="-300" max="300" value={layout[element].x} onChange={(e) => handleChange(element, 'x', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <label className="font-medium text-gray-600">Posição Y</label>
          <span className="font-mono text-gray-500">{layout[element].y}px</span>
        </div>
        <input type="range" min="-300" max="300" value={layout[element].y} onChange={(e) => handleChange(element, 'y', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
      </div>
    </div>
  );

  return (
    <details className="bg-white border rounded-lg shadow-sm mt-4">
      <summary className="p-3 flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
        <SlidersHorizontal size={16} />
        Ajustar Layout do Slide
      </summary>
      <div className="p-4">
        {renderControlGroup('image', 'Imagem do Produto')}
        {renderControlGroup('name', 'Nome do Produto')}
        {product.description && renderControlGroup('description', 'Descrição')}
        {renderControlGroup('price', 'Bloco de Preço')}
      </div>
    </details>
  );
};

export default SlideLayoutControls;