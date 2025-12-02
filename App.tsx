import React, { useState, useEffect } from 'react';
import SidebarNav from './src/components/SidebarNav';
import PosterBuilderPage from './src/pages/PosterBuilderPage';
import DigitalSignagePage from './src/pages/DigitalSignagePage';
import SocialMediaPage from './src/pages/SocialMediaPage';
import AudioVideoAdPage from './src/pages/AudioVideoAdPage';
import SettingsPage from './src/pages/SettingsPage';
import ProductManagerPage from './src/pages/ProductManagerPage';
import CompanyInfoPage from './src/pages/CompanyInfoPage';
import UserManagementPage from './src/pages/UserManagementPage';
import ProfilePage from './src/pages/ProfilePage';
import LoginPage from './src/pages/LoginPage';
import AdminPage from './src/pages/AdminPage';
import ReportsPage from './src/pages/ReportsPage';
import UpgradeOverlay from './src/components/UpgradeOverlay';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { INITIAL_THEME, INITIAL_PRODUCTS, POSTER_FORMATS } from './src/state/initialState';
import { PosterTheme, Product, PosterFormat, SavedImage, Permission } from './types';
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

const MODULE_PERMISSIONS: Record<string, Permission> = {
  'profile': 'access_builder',
  'poster': 'access_builder',
  'product-db': 'manage_products',
  'company': 'access_builder',
  'signage': 'access_signage',
  'social': 'access_social_media',
  'ads': 'access_ads',
  'reports': 'view_reports',
  'users': 'manage_users',
  'settings': 'access_settings',
  'admin': 'access_admin_panel',
};

const AppContent: React.FC = () => {
  const { session, profile, hasPermission } = useAuth();
  const userId = session?.user?.id;
  
  const [activeModule, setActiveModule] = useState('profile');
  
  const { theme, setTheme, loading: loadingTheme } = useUserSettings(userId);
  const [products, setProducts] = useLocalStorageState<Product[]>('ofertaflash_products', INITIAL_PRODUCTS);
  const { savedImages, addSavedImage, deleteImage: deleteSavedImage, loading: loadingSavedImages } = useSavedImages(userId);
  const { loading: loadingRegisteredProducts } = useProductDatabase(userId);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loadingTheme && !loadingRegisteredProducts && !loadingSavedImages && profile) {
      let themeUpdated = false;
      
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
                      path: oldLogo.path,
                  }
              };
          });
      }

      if (products.some(p => !p.layouts)) {
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.layouts ? p : { ...p, layouts: createInitialLayouts() }
          )
        );
      }
      
      const currentModulePermission = MODULE_PERMISSIONS[activeModule];
      
      if (!hasPermission(currentModulePermission)) {
        const firstAllowedModule = Object.entries(MODULE_PERMISSIONS).find(([_, permission]) => hasPermission(permission));
        if (firstAllowedModule) {
            setActiveModule(firstAllowedModule[0]);
        } else {
            setActiveModule('poster'); 
        }
      }
      
      setIsReady(true);
    }
  }, [theme, products, setTheme, setProducts, loadingTheme, loadingRegisteredProducts, loadingSavedImages, profile, hasPermission, activeModule]);

  const formats: PosterFormat[] = POSTER_FORMATS;
  
  if (!session) {
    return <LoginPage />;
  }

  if (!isReady || !profile) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-lg text-gray-700">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  const currentModulePermission = MODULE_PERMISSIONS[activeModule];
  const isModuleAllowed = hasPermission(currentModulePermission);

  const renderModuleContent = () => {
    const commonProps = { theme, setTheme, products, setProducts, formats };

    if (activeModule === 'admin') {
      return <AdminPage setActiveHubModule={setActiveModule} />;
    }

    switch (activeModule) {
      case 'profile':
        return <ProfilePage />;
      case 'poster':
        return <PosterBuilderPage {...commonProps} addSavedImage={addSavedImage} />;
      case 'product-db':
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
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UserManagementPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-red-600 mb-4">Módulo Inválido</h3>
                    <p className="text-gray-600">O módulo selecionado não existe ou não está configurado.</p>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <SidebarNav activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 relative h-full overflow-hidden">
         <div className="relative w-full h-full">
            {renderModuleContent()}
            {!isModuleAllowed && activeModule !== 'admin' && (
                <UpgradeOverlay requiredPermission={currentModulePermission} />
            )}
         </div>
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