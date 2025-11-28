import React, { useState, useEffect } from 'react';
import SidebarNav from './src/components/SidebarNav';
import PosterBuilderPage from './src/pages/PosterBuilderPage';
import DigitalSignagePage from './src/pages/DigitalSignagePage';
import SocialMediaPage from './src/pages/SocialMediaPage';
import AudioVideoAdPage from './src/pages/AudioVideoAdPage';
import SettingsPage from './src/pages/SettingsPage';
import { INITIAL_THEME, INITIAL_PRODUCTS, POSTER_FORMATS } from './src/state/initialState';
import { PosterTheme, Product, PosterFormat } from './types';
import { useLocalStorageState } from './src/hooks/useLocalStorageState';

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
  'tv': JSON.parse(JSON.stringify(defaultLayout)),
});

export default function App() {
  const [activeModule, setActiveModule] = useState('poster');
  
  const [theme, setTheme] = useLocalStorageState<PosterTheme>('ofertaflash_theme', INITIAL_THEME);
  const [products, setProducts] = useLocalStorageState<Product[]>('ofertaflash_products', INITIAL_PRODUCTS);
  
  useEffect(() => {
    // This effect runs once on mount to ensure the state loaded from localStorage is valid.
    // It handles cases where the user has an older version of the state saved.
    if (!theme.headerElements) {
      console.log("Migrating theme state from localStorage to new structure...");
      setTheme(prevTheme => {
        // Create a new theme object that has the new structure but preserves old user settings.
        const migratedTheme = { ...INITIAL_THEME, ...prevTheme };
        // Explicitly set the new `headerElements` property from the default.
        migratedTheme.headerElements = INITIAL_THEME.headerElements;
        return migratedTheme;
      });
    }

    if (products.some(p => !p.layouts)) {
      console.log("Migrating products state from localStorage to new structure...");
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.layouts ? p : { ...p, layouts: createInitialLayouts() }
        )
      );
    }
  }, []); // The empty dependency array ensures this runs only once.

  const formats: PosterFormat[] = POSTER_FORMATS;

  const renderModule = () => {
    const commonProps = { theme, setTheme, products, setProducts, formats };

    switch (activeModule) {
      case 'poster':
        return <PosterBuilderPage {...commonProps} />;
      case 'signage':
        return <DigitalSignagePage {...commonProps} />;
      case 'social':
        return <SocialMediaPage {...commonProps} />;
      case 'ads':
        return <AudioVideoAdPage theme={theme} products={products} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PosterBuilderPage {...commonProps} />;
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