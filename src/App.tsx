// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { CategoryMenu } from './components/CategoryMenu';
import { DeviceFinder } from './components/DeviceFinder';
import { FunctionalityExplorer } from './components/FunctionalityExplorer';
import { CommunicationTool } from './components/CommunicationTool';
import { Footer } from './components/Footer';
import { DisabilityCategory, Page, Theme } from './types';

export default function App() {
  // Lee el guardado; si no hay, por defecto 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'light';
    } catch {
      return 'light';
    }
  });

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<DisabilityCategory | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const navigateTo = (page: Page, category: DisabilityCategory | null = selectedCategory) => {
    setCurrentPage(page);
    setSelectedCategory(category);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    const goBackToHome = () => navigateTo('home', null);
    const goBackToCategoryMenu = () => {
      if (selectedCategory) navigateTo('category_menu', selectedCategory);
      else goBackToHome();
    };
    switch (currentPage) {
      case 'category_menu':
        return selectedCategory ? (
          <CategoryMenu category={selectedCategory} navigateTo={navigateTo} goBack={goBackToHome} />
        ) : <Home navigateTo={navigateTo} />;
      case 'devices':
        return selectedCategory ? (
          <DeviceFinder category={selectedCategory} goBack={goBackToCategoryMenu} />
        ) : <Home navigateTo={navigateTo} />;
      case 'functionalities':
        return selectedCategory ? (
          <FunctionalityExplorer category={selectedCategory} goBack={goBackToCategoryMenu} />
        ) : <Home navigateTo={navigateTo} />;
      case 'tools':
        return <CommunicationTool goBack={goBackToHome} />;
      case 'home':
      default:
        return <Home navigateTo={navigateTo} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <Header
        theme={theme}
        setTheme={setTheme}
        goHome={() => navigateTo('home', null)}
      />
      <main id="main-content" className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}