
import React from 'react';
import { DisabilityCategory, Page } from '../types';

interface HomeProps {
  navigateTo: (page: Page, category?: DisabilityCategory) => void;
}

// New card design for the main categories
const CategoryCard: React.FC<{ onClick: () => void; title: string; description: string; icon: JSX.Element }> = ({ onClick, title, description, icon }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl focus:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
    aria-label={`Explorar tecnologías para discapacidad ${title.toLowerCase()}`}
  >
    <div className="text-blue-600 dark:text-blue-400 mb-6 transition-transform duration-300 group-hover:scale-110">
      {React.cloneElement(icon, { className: "h-24 w-24", "stroke-width": "1.5" })}
    </div>
    <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
    <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
  </button>
);

// A distinct button for the tools section
const ToolsNavButton: React.FC<{ onClick: () => void; title: string; description: string; icon: JSX.Element }> = ({ onClick, title, description, icon }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl focus:shadow-2xl transition-shadow duration-300 flex items-center space-x-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
  >
    <div className="flex-shrink-0 w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
      {icon}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">{title}</h3>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </button>
);


export const Home: React.FC<HomeProps> = ({ navigateTo }) => {
  return (
    <div className="space-y-16 py-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
          Bienvenido al Portal de Accesibilidad
        </h2>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
          Seleccione una categoría para explorar tecnologías de asistencia o acceda a nuestras herramientas de comunicación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <CategoryCard
          onClick={() => navigateTo('category_menu', 'visual')}
          title="Visual"
          description="Tecnologías para personas con ceguera o discapacidad visual."
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-4.43a1.012 1.012 0 011.431 0l4.43 4.43a1.012 1.012 0 010 .639l-4.43 4.43a1.012 1.012 0 01-1.431 0l-4.43-4.43z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <CategoryCard
          onClick={() => navigateTo('category_menu', 'auditiva')}
          title="Auditiva"
          description="Tecnologías para personas con sordera o discapacidad auditiva."
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>}
        />
        <CategoryCard
          onClick={() => navigateTo('category_menu', 'habla')}
          title="Habla"
          description="Tecnologías para personas con mudez o dificultades del habla."
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.125 1.125 0 01-1.59 0l-3.72-3.72a2.36 2.36 0 01-1.98-2.193v-4.286c0-.97.616-1.813 1.5-2.097m6.75 0a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25m6.75 0l-1.125 1.125m-2.25-2.25L11.25 7.5" /></svg>}
        />
      </div>

      <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
        <ToolsNavButton
          onClick={() => navigateTo('tools')}
          title="Herramientas de Comunicación"
          description="Utilice nuestras herramientas de texto a voz y voz a texto para comunicarse."
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
        />
      </div>
    </div>
  );
};
