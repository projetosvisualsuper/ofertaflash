import React, { useState } from 'react';
import SidebarNav from './components/SidebarNav';
import PosterBuilderPage from './pages/PosterBuilderPage';
import DigitalSignagePage from './pages/DigitalSignagePage';
import SocialMediaPage from './pages/SocialMediaPage';
import AudioVideoAdPage from './pages/AudioVideoAdPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [activeModule, setActiveModule] = useState('poster');

  const renderModule = () => {
    switch (activeModule) {
      case 'poster':
        return <PosterBuilderPage />;
      case 'signage':
        return <DigitalSignagePage />;
      case 'social':
        return <SocialMediaPage />;
      case 'ads':
        return <AudioVideoAdPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PosterBuilderPage />;
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