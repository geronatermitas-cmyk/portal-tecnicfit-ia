
import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface CommunicationToolProps {
  goBack: () => void;
}

export const CommunicationTool: React.FC<CommunicationToolProps> = ({ goBack }) => {
  const [textToSpeak, setTextToSpeak] = useState('');
  const { speak, isSpeaking } = useTextToSpeech();
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition('es-ES');

  const handleSpeak = () => {
    if (textToSpeak.trim()) {
      speak(textToSpeak);
    }
  };

  return (
    <section aria-labelledby="comm-tool-title">
      <div className="relative mb-8 text-center">
        <button
          onClick={goBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          aria-label="Volver a la página de inicio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Volver
        </button>
        <h2 id="comm-tool-title" className="text-3xl md:text-4xl font-bold">
          Herramienta de Comunicación
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Text to Speech */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Texto a Voz</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">Escriba un texto y presione el botón para que el dispositivo lo lea en voz alta.</p>
          <textarea
            value={textToSpeak}
            onChange={(e) => setTextToSpeak(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Texto para leer en voz alta"
            placeholder="Escriba aquí..."
          />
          <button
            onClick={handleSpeak}
            disabled={isSpeaking || !textToSpeak.trim()}
            className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
          >
            {isSpeaking ? 'Hablando...' : 'Leer en Voz Alta'}
          </button>
        </div>

        {/* Speech to Text */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Voz a Texto</h3>
          {!isSupported && <p className="text-red-500">El reconocimiento de voz no es compatible con su navegador.</p>}
          {isSupported && (
            <>
              <p className="mb-4 text-gray-600 dark:text-gray-300">Presione el botón para hablar. Su voz se transcribirá a texto.</p>
              <div
                className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                aria-live="polite"
              >
                {transcript || <span className="text-gray-400 dark:text-gray-500">El texto transcrito aparecerá aquí...</span>}
              </div>
              <button
                onClick={isListening ? stopListening : startListening}
                className={`mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {isListening ? 'Dejar de Escuchar' : 'Empezar a Escuchar'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
