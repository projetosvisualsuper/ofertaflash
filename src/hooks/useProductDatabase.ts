import { useLocalStorageState } from './useLocalStorageState';
import { RegisteredProduct } from '../../types';

const initialProducts: RegisteredProduct[] = [
  {
    id: 'db-1',
    name: 'Picanha Friboi',
    description: 'Corte nobre, maciez e sabor inigualáveis.',
    defaultPrice: '69.90',
    defaultUnit: 'kg',
    image: 'https://assets.aistudio.google.com/generative-ai-studio/templates/Marketing/picanha_placeholder.png',
  },
  {
    id: 'db-2',
    name: 'Cerveja Heineken 350ml',
    description: 'Lata, puro malte, refrescante.',
    defaultPrice: '4.50',
    defaultOldPrice: '5.99',
    defaultUnit: 'un',
    image: 'https://assets.aistudio.google.com/generative-ai-studio/templates/Marketing/heineken_placeholder.png',
  },
];

export function useProductDatabase() {
  const [registeredProducts, setRegisteredProducts] = useLocalStorageState<RegisteredProduct[]>('ofertaflash_registered_products', initialProducts);

  const addProduct = (product: Omit<RegisteredProduct, 'id'>) => {
    const newProduct: RegisteredProduct = {
      ...product,
      id: crypto.randomUUID(),
    };
    setRegisteredProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<RegisteredProduct>) => {
    setRegisteredProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  const deleteProduct = (id: string) => {
    setRegisteredProducts(prev => prev.filter(p => p.id !== id));
  };

  return {
    registeredProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}