import React, { useState, useEffect } from 'react';
import SidebarNav from './src/components/SidebarNav';
import PosterBuilderPage from './src/pages/PosterBuilderPage';
import DigitalSignagePage from './src/pages/DigitalSignagePage';
import SocialMediaPage from './src/pages/SocialMediaPage';
import AudioVideoAdPage from './src/pages/AudioVideoAdPage';
import SettingsPage from './src/pages/SettingsPage';
import ProductManagerPage from './src/pages/ProductManagerPage';
import CompanyInfoPage from './src/pages/CompanyInfoPage';
import LoginPage from './src/pages/LoginPage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { INITIAL_THEME, INITIAL_PRODUCTS, POSTER_FORMATS } from './src/state/initialState';
import { PosterTheme, Product, PosterFormat, SavedImage } from './types';
import { useLocalStorageState } from './src/hooks/useLocalStorageState';
import { useUserSettings } from './src/hooks/useUserSettings';
import { useProductDatabase } from './src/hooks/useProductDatabase';
import { useSavedImages } from './src/hooks/useSavedImages';
import { Loader2 } from 'lucide-react';

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const createInitialLayouts = () => ({
  'story': JSON.parse(JSON.stringify(defaultLayout)),
  'feed': JSON.parse(JSON.stringify(defaultLayout)),
  'a4': JSON.parse(JSON.stringify(defaultLayout)),
  'landscape-poster': JSON.parse(JSON.stringify(defaultLayout)),
  'tv': JSON.parse(JSON.stringify(defaultLayout)),
});

const createInitialLogoLayouts = (base: any) => ({
    'story': { scale: base.scale || 1, x: base.x || 0, y: base.y || 0 },
    'feed': { scale: base.scale || 1, x: base.x || 0, y: base.y || 0 },
    'a4': { scale: base.scale || 1, x: base.x || 0, y: base.y || 0 },
    'landscape-poster': { scale: base.scale || 1, x: base.x || 0, y: base.y || 0 },
    'tv': { scale: base.scale || 1, x: base.x || 0, y: base.y || 0 },
});

const AppContent: React.FC = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  const [activeModule, setActiveModule] = useState('poster');
  
  // Usando Supabase para Theme
  const { theme, setTheme, loading: loadingTheme } = useUserSettings(userId);
  
  // Usando localStorage APENAS para os produtos do cartaz (não os cadastrados)
  const [products, setProducts] = useLocalStorageState<Product[]>('ofertaflash_products', INITIAL_PRODUCTS);
  
  // Usando Supabase para Imagens Salvas
  const { savedImages, addSavedImage, deleteImage: deleteSavedImage, loading: loadingSavedImages } = useSavedImages(userId);
  
  // Hook para o Banco de Produtos (Registered Products)
  const { loading: loadingRegisteredProducts } = useProductDatabase(userId);
  
  const [isReady, setIsReady] = useState(false);

  // Lógica de migração e verificação de prontidão
  useEffect(() => {
    let themeUpdated = false;
    let productsUpdated = false;

    // 1. Theme structure migration (ensures all fields exist)
    if (!theme.headerElements || typeof theme.layoutCols !== 'object' || theme.layoutCols === null || !theme.companyInfo) {
      themeUpdated = true;
      setTheme(prevTheme => ({
        ...INITIAL_THEME,
        ...prevTheme,
        headerElements: prevTheme.headerElements || INITIAL_THEME.headerElements,
        layoutCols: INITIAL_THEME.layoutCols,
        companyInfo: prevTheme.companyInfo || INITIAL_THEME.companyInfo,
      }));
    }

    // 2. Logo layout migration
    if (theme.logo && !(theme.logo as any).layouts) {
        themeUpdated = true;
        setTheme(prevTheme => {
            if (!prevTheme.logo) return prevTheme;
            const oldLogo: any = prevTheme.logo;
            return {
                ...prevTheme,
                logo: {
                    src: oldLogo.src,
                    layouts: createInitialLogoLayouts(oldLogo),
                }
            };
        });
    }

    // 3. Product layout migration
    if (products.some(p => !p.layouts)) {
      productsUpdated = true;
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.layouts ? p : { ...p, layouts: createInitialLayouts() }
        )
      );
    }

    if (!loadingTheme && !loadingRegisteredProducts && !loadingSavedImages) {
      setIsReady(true);
    }
  }, [theme, products, setTheme, setProducts, loadingTheme, loadingRegisteredProducts, loadingSavedImages]);

  const formats: PosterFormat[] = POSTER_FORMATS;
  
  if (!session) {
    return <LoginPage />;
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-lg text-gray-700">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    const commonProps = { theme, setTheme, products, setProducts, formats };

    switch (activeModule) {
      case 'poster':
        return <PosterBuilderPage {...commonProps} addSavedImage={addSavedImage} />;
      case 'product-db':
        // O ProductManagerPage usa useProductDatabase internamente, que já usa o userId
        return <ProductManagerPage />;
      case 'company':
        return <CompanyInfoPage theme={theme} setTheme={setTheme} />;
      case 'signage':
        return <DigitalSignagePage {...commonProps} />;
      case 'social':
        return <SocialMediaPage 
          {...commonProps} 
          savedImages={savedImages} 
          deleteImage={deleteSavedImage} 
        />;
      case 'ads':
        return <AudioVideoAdPage theme={theme} products={products} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PosterBuilderPage {...commonProps} addSavedImage={addSavedImage} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <SidebarNav activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 relative h-full overflow-hidden">
         {renderModule()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}