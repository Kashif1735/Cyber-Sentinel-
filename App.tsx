
import React, { useState } from 'react';
import { Sidebar, View } from './components/Sidebar';
import { Header } from './components/Header';
import { PhishingDetector } from './components/PhishingDetector';
import { NetworkMonitor } from './components/NetworkMonitor';
import { FileIntegrity } from './components/FileIntegrity';
import { PasswordManager } from './components/PasswordManager';
import { SecureLogin } from './components/SecureLogin';
import { About } from './components/About';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.PhishingDetector);

  const renderView = () => {
    switch (currentView) {
      case View.PhishingDetector:
        return <PhishingDetector />;
      case View.NetworkMonitor:
        return <NetworkMonitor />;
      case View.FileIntegrity:
        return <FileIntegrity />;
      case View.PasswordManager:
        return <PasswordManager />;
      case View.SecureLogin:
          return <SecureLogin />;
      case View.About:
        return <About />;
      default:
        return <PhishingDetector />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-primary text-light-text font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-primary p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
