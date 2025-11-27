import React, { useState } from 'react';
import SidebarNav from './src/components/SidebarNav';
import PosterBuilderPage from './src/pages/PosterBuilderPage';
import DigitalSignagePage from './src/pages/DigitalSignagePage';
import SocialMediaPage from './src/pages/SocialMediaPage';
import AudioVideoAdPage from './src/pages/AudioVideoAdPage';
import SettingsPage from './src/pages/SettingsPage';
import { INITIAL_THEME, INITIAL_PRODUCTS, POSTER_FORMATS } from './src/state/initialState';
import { PosterTheme, Product, PosterFormat } from './types';
import { useLocalStorageState } from './src/hooks/useLocalStorageState';

export default function App() {
  const [activeModule, setActiveModule] = useState('poster');
  
  // Use o hook para persistir o estado
  const [theme, setTheme] = useLocalStorageState<PosterTheme>('ofertaflash_theme', INITIAL_THEME);
  const [products, setProducts] = useLocalStorageState<Product[]>('ofertaflash_products', INITIAL_PRODUCTS);
  
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
        // Pass only necessary props (theme and products)
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