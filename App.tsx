import React, { useState, useEffect } from 'react';
import SidebarNav from './src/components/SidebarNav';
import PosterBuilderPage from './src/pages/PosterBuilderPage';
import DigitalSignagePage from './src/pages/DigitalSignagePage';
import SocialMediaPage from './src/pages/SocialMediaPage';
import AudioVideoAdPage from './src/pages/AudioVideoAdPage';
import SettingsPage from './src/pages/SettingsPage';
import { INITIAL_THEME, INITIAL_PRODUCTS, POSTER_FORMATS } from './src/state/initialState';
import { PosterTheme, Product, PosterFormat, SavedImage } from './types';
import { useLocalStorageState } from './src/hooks/useLocalStorageState';
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

export default function App() {
  const [activeModule, setActiveModule] = useState('poster');
  
  const [theme, setTheme] = useLocalStorageState<PosterTheme>('ofertaflash_theme', INITIAL_THEME);
  const [products, setProducts] = useLocalStorageState<Product[]>('ofertaflash_products', INITIAL_PRODUCTS);
  const [savedImages, setSavedImages] = useLocalStorageState<SavedImage[]>('ofertaflash_saved_images', []);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let themeUpdated = false;
    let productsUpdated = false;

    // Check and migrate theme state
    if (!theme.headerElements || typeof theme.layoutCols !== 'object' || theme.layoutCols === null) {
      console.log("Migrating theme state from localStorage to new structure...");
      themeUpdated = true;
      setTheme(prevTheme => ({
        ...INITIAL_THEME,
        ...prevTheme,
        headerElements: prevTheme.headerElements || INITIAL_THEME.headerElements,
        layoutCols: INITIAL_THEME.layoutCols, // Reset layoutCols to the new structure with defaults
      }));
    }

    // Check and migrate logo state
    if (theme.logo && !(theme.logo as any).layouts) {
        console.log("Migrating logo state from localStorage to new structure...");
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

    // Check and migrate products state
    if (products.some(p => !p.layouts)) {
      console.log("Migrating products state from localStorage to new structure...");
      productsUpdated = true;
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.layouts ? p : { ...p, layouts: createInitialLayouts() }
        )
      );
    }

    if (!themeUpdated && !productsUpdated) {
      setIsReady(true);
    }
  }, []); // Run only once on mount

  // This effect marks the app as ready once the data structures are confirmed to be valid.
  useEffect(() => {
      if (theme.headerElements && typeof theme.layoutCols === 'object' && theme.layoutCols !== null && !products.some(p => !p.layouts) && (!theme.logo || (theme.logo as any).layouts)) {
          setIsReady(true);
      }
  }, [theme, products]);

  const formats: PosterFormat[] = POSTER_FORMATS;
  
  const addSavedImage = (image: SavedImage) => {
    setSavedImages(prev => [image, ...prev]);
  };

  const deleteSavedImage = (id: string) => {
    setSavedImages(prev => prev.filter(img => img.id !== id));
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-lg text-gray-700">Carregando e atualizando dados...</p>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    const commonProps = { theme, setTheme, products, setProducts, formats };

    switch (activeModule) {
      case 'poster':
        return <PosterBuilderPage {...commonProps} addSavedImage={addSavedImage} />;
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