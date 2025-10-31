// src/components/CategoryMenu.tsx
import { useSEO } from '../hooks/useSEO';
import React, { type ReactElement } from 'react';
import { DisabilityCategory, Page } from '../types';

interface CategoryMenuProps {
  category: DisabilityCategory;
  navigateTo: (page: Page, category?: DisabilityCategory) => void;
  goBack: () => void;
}

/** Título e icono por categoría */
const categoryInfo: Record<DisabilityCategory, { title: string; icon: ReactElement }> = {
  visual: {
    title: 'Discapacidad Visual',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-4.43a1.012 1.012 0 011.431 0l4.43 4.43a1.012 1.012 0 010 .639l-4.43 4.43a1.012 1.012 0 01-1.431 0l-4.43-4.43z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  auditiva: {
    title: 'Discapacidad Auditiva',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
  habla: {
    title: 'Discapacidad del Habla',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.125 1.125 0 01-1.59 0l-3.72-3.72a2.36 2.36 0 01-1.98-2.193v-4.286c0-.97.616-1.813 1.5-2.097m6.75 0a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25m6.75 0l-1.125 1.125m-2.25-2.25L11.25 7.5" />
      </svg>
    ),
  },
};

/** Botón de opción (“cards” grandes) */
const ChoiceButton: React.FC<{
  onClick: () => void;
  title: string;
  description: string;
  icon: ReactElement;
}> = ({ onClick, title, description, icon }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl focus:shadow-2xl transition-shadow duration-300 flex items-center space-x-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
  >
    <div className="flex-shrink-0 w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'h-10 w-10' })}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{title}</h3>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </button>
);

export const CategoryMenu: React.FC<CategoryMenuProps> = ({ category, navigateTo, goBack }) => {
  const { title, icon } = categoryInfo[category];
  // --- SEO dinámico por categoría ---
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://portal-tecnicfit-ia.vercel.app';

  const pretty = {
    visual:   { t: 'Discapacidad Visual',  d: 'Opciones y recursos para discapacidad visual.' },
    auditiva: { t: 'Discapacidad Auditiva', d: 'Opciones y recursos para discapacidad auditiva.' },
    habla:    { t: 'Discapacidad del Habla', d: 'Opciones y recursos para trastornos del habla.' },
  }[category];

  useSEO({
    title: `Portal de Accesibilidad · ${pretty.t}`,
    description: `Seleccione herramientas: catálogo de dispositivos y funcionalidades. ${pretty.d}`,
    url: `${origin}/?category=${category}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Portal de Accesibilidad · ${pretty.t}`,
      url: `${origin}/?category=${category}`,
      inLanguage: 'es',
      about: pretty.d,
      publisher: { '@type': 'Organization', name: 'TecnicFit IA' },
    },
  });
  // --- fin SEO ---
  return (
    <section aria-labelledby="category-menu-title">
      <div className="relative mb-12 text-center">
        <button
          onClick={goBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          aria-label="Volver a la página de inicio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Volver
        </button>

        <div className="inline-flex items-center justify-center gap-4">
          <div className="text-blue-600 dark:text-blue-400">
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'h-12 w-12' })}
          </div>
          <h2 id="category-menu-title" className="text-3xl md:text-4xl font-bold">
            {title}
          </h2>
        </div>

        <p className="mt-4 mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
          Seleccione una opción para continuar.
        </p>
      </div>

      <div className="space-y-8 mx-auto max-w-4xl">
        <ChoiceButton
          onClick={() => navigateTo('devices', category)}
          title="Catálogo de Dispositivos"
          description="Explore dispositivos físicos y hardware de asistencia."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />

        <ChoiceButton
          onClick={() => navigateTo('functionalities', category)}
          title="Funcionalidades y Software"
          description="Descubra aplicaciones, software y funciones integradas en sistemas operativos."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>
    </section>
  );
};

export default CategoryMenu;