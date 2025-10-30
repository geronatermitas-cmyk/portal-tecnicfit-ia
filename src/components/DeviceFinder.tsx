
import React, { useState, useEffect } from 'react';
import { fetchAssistiveDevices, generateImageForTerm } from '../services/geminiService';
import { DisabilityCategory, Device } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface DeviceFinderProps {
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

const DeviceCard: React.FC<{ device: Device; onSpeak: (text: string) => void }> = ({ device, onSpeak }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 flex flex-col">
    {device.imageUrl ? (
        <img
          className="w-full h-48 object-cover"
          src={device.imageUrl}
          alt={`Imagen generada de ${device.nombre}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://picsum.photos/seed/${encodeURIComponent(device.nombre)}/400/300`;
            target.alt = `Imagen de marcador de posición para ${device.nombre}`;
          }}
        />
    ) : (
        <ImagePlaceholder />
    )}
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{device.nombre}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-300 flex-grow">{device.descripcion}</p>
      <h4 className="mt-4 font-semibold text-lg text-gray-800 dark:text-gray-200">Características Principales:</h4>
      <ul className="mt-2 list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
        {device.caracteristicas.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <button
        onClick={() => onSpeak(`Dispositivo: ${device.nombre}. Descripción: ${device.descripcion}. Características: ${device.caracteristicas.join(', ')}`)}
        className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        aria-label={`Leer descripción de ${device.nombre}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7 4a1 1 0 011.707-.707l6 6a1 1 0 010 1.414l-6 6A1 1 0 017 16V4zm4 5a1 1 0 100 2h5a1 1 0 100-2h-5z" clipRule="evenodd" />
        </svg>
        Leer Descripción
      </button>
    </div>
  </div>
);

export const DeviceFinder: React.FC<DeviceFinderProps> = ({ category, goBack }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setDevices([]);
      try {
        const baseDevices = await fetchAssistiveDevices(category);
        const devicesWithPlaceholders = baseDevices.map(d => ({ ...d, imageUrl: '' }));
        setDevices(devicesWithPlaceholders);
        setIsLoading(false);

        // Carga secuencial de imágenes para evitar rate limiting
        for (let i = 0; i < baseDevices.length; i++) {
            const device = baseDevices[i];
            const imageUrl = await generateImageForTerm(device.nombre);
            setDevices(prevDevices => {
                const newDevices = [...prevDevices];
                if (newDevices[i]) {
                    newDevices[i].imageUrl = imageUrl;
                }
                return newDevices;
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
    <section aria-labelledby="device-finder-title">
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
        <h2 id="device-finder-title" className="text-3xl md:text-4xl font-bold">
          Catálogo de Dispositivos
        </h2>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">{categorySubtitles[category]}</p>
      </div>
      {isLoading && (
        <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="text-center p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!isLoading && devices.length === 0 && !error && <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No se encontraron dispositivos.</p>}
        {devices.map((device) => (
          <DeviceCard key={device.nombre} device={device} onSpeak={speak} />
        ))}
      </div>
    </section>
  );
};
