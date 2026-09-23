import { useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { GestorCartera, type Aviso } from './components/GestorCartera';

const queryClient = new QueryClient();

function App() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  function handleAviso(aviso: Aviso) {
    setAvisos((prev) => [aviso, ...prev.slice(0, 4)]);
    setTimeout(() => setAvisos((prev) => prev.slice(0, -1)), 4000);
  }

  const colorAviso: Record<Aviso['tipo'], string> = {
    exito: 'bg-emerald-800 border-emerald-600 text-emerald-100',
    error: 'bg-red-900 border-red-700 text-red-100',
    info: 'bg-indigo-900 border-indigo-700 text-indigo-100',
  };

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {/* Notificaciones */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
          {avisos.map((a, i) => (
            <div
              key={i}
              className={`border rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${colorAviso[a.tipo]}`}
            >
              {a.mensaje}
            </div>
          ))}
        </div>

        <GestorCartera onAviso={handleAviso} />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
