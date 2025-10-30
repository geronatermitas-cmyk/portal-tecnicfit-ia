
import React, { useState, useEffect } from 'react';
import { fetchAssistiveFunctionalities, generateImageForTerm } from '../services/geminiService';
import { DisabilityCategory, Functionality } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface FunctionalityExplorerProps {
  category: DisabilityCategory;
  goBack: () => void;
}

const categorySubtitles: Record<DisabilityCategory, string> = {
  visual: 'Para Discapacidad Visual',
  auditiva: 'Para Discapacidad Auditiva',
  habla: 'Para Discapacidad del Habla',
};

const ImagePlaceholder = () => (
    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-400 dark:text-gray-500 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
        </svg>
    </div>
);

const FunctionalityCard: React.FC<{ item: Functionality; onSpeak: (text: string) => void }> = ({ item, onSpeak }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 flex flex-col">
    {item.imageUrl ? (
        <img
          className="w-full h-48 object-cover"
          src={item.imageUrl}
          alt={`Imagen generada de ${item.nombre}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://picsum.photos/seed/${encodeURIComponent(item.nombre)}/400/300`;
            target.alt = `Imagen de marcador de posición para ${item.nombre}`;
          }}
        />
    ) : (
        <ImagePlaceholder />
    )}
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{item.nombre}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-300 flex-grow">{item.descripcion}</p>
      <div className="mt-4">
        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Plataformas:</h4>
        <div className="flex flex-wrap gap-2 mt-2">
          {item.plataformas.map((platform, index) => (
            <span key={index} className="px-3 py-1 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">{platform}</span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onSpeak(`Funcionalidad: ${item.nombre}. Descripción: ${item.descripcion}. Plataformas: ${item.plataformas.join(', ')}`)}
        className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
        aria-label={`Leer descripción de ${item.nombre}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7 4a1 1 0 011.707-.707l6 6a1 1 0 010 1.414l-6 6A1 1 0 017 16V4zm4 5a1 1 0 100 2h5a1 1 0 100-2h-5z" clipRule="evenodd" />
        </svg>
        Leer Descripción
      </button>
    </div>
  </div>
);

export const FunctionalityExplorer: React.FC<FunctionalityExplorerProps> = ({ category, goBack }) => {
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setFunctionalities([]);
      try {
        const baseFunctionalities = await fetchAssistiveFunctionalities(category);
        const functionalitiesWithPlaceholders = baseFunctionalities.map(f => ({ ...f, imageUrl: '' }));
        setFunctionalities(functionalitiesWithPlaceholders);
        setIsLoading(false);

        // Carga secuencial de imágenes para evitar rate limiting
        for (let i = 0; i < baseFunctionalities.length; i++) {
            const func = baseFunctionalities[i];
            const imageUrl = await generateImageForTerm(func.nombre);
            setFunctionalities(prevFuncs => {
                const newFuncs = [...prevFuncs];
                if (newFuncs[i]) {
                    newFuncs[i].imageUrl = imageUrl;
                }
                return newFuncs;
            });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
        setIsLoading(false);
      }
    };
    loadData();
  }, [category]);

  return (
    <section aria-labelledby="functionality-explorer-title">
      <div className="relative mb-8 text-center">
        <button
          onClick={goBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          aria-label="Volver al menú de categoría"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Volver
        </button>
        <h2 id="functionality-explorer-title" className="text-3xl md:text-4xl font-bold">
          Funcionalidades y Software
        </h2>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">{categorySubtitles[category]}</p>
      </div>
      {isLoading && (
         <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        </div>
      )}
      {error && (
        <div className="text-center p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!isLoading && functionalities.length === 0 && !error && <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No se encontraron funcionalidades.</p>}
        {functionalities.map((item) => (
          <FunctionalityCard key={item.nombre} item={item} onSpeak={speak} />
        ))}
      </div>
    </section>
  );
};
