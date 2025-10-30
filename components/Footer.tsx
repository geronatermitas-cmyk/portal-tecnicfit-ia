
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 mt-12 py-8 shadow-inner">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Política de Privacidad</a>
          <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Términos de Servicio</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Portal de Accesibilidad. Todos los derechos reservados.</p>
        <p className="mt-2 text-sm font-semibold">Desarrollado por tecnicfit IA</p>
      </div>
    </footer>
  );
};
