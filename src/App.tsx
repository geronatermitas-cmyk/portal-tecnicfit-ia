
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { CategoryMenu } from './components/CategoryMenu';
import { DeviceFinder } from './components/DeviceFinder';
import { FunctionalityExplorer } from './components/FunctionalityExplorer';
import { CommunicationTool } from './components/CommunicationTool';
import { Footer } from './components/Footer';
import { DisabilityCategory, Page, Theme } from './types';

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<DisabilityCategory | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const navigateTo = (page: Page, category: DisabilityCategory | null = selectedCategory) => {
    setCurrentPage(page);
    setSelectedCategory(category);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    const goBackToHome = () => navigateTo('home', null);
    const goBackToCategoryMenu = () => {
        if(selectedCategory) {
            navigateTo('category_menu', selectedCategory)
        } else {
            goBackToHome(); // Fallback
        }
    };

    switch (currentPage) {
      case 'category_menu':
        return selectedCategory ? <CategoryMenu category={selectedCategory} navigateTo={navigateTo} goBack={goBackToHome} /> : <Home navigateTo={navigateTo} />;
      case 'devices':
        return selectedCategory ? <DeviceFinder category={selectedCategory} goBack={goBackToCategoryMenu} /> : <Home navigateTo={navigateTo} />;
      case 'functionalities':
        return selectedCategory ? <FunctionalityExplorer category={selectedCategory} goBack={goBackToCategoryMenu} /> : <Home navigateTo={navigateTo} />;
      case 'tools':
        return <CommunicationTool goBack={goBackToHome} />;
      case 'home':
      default:
        return <Home navigateTo={navigateTo} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
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
