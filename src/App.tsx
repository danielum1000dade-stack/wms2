import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import RecebimentoPage from './pages/RecebimentoPage';
import ArmazenagemPage from './pages/ArmazenagemPage';
import PedidosPage from './pages/PedidosPage';
import PickingPage from './pages/PickingPage';
import ConferenciaPage from './pages/ConferenciaPage';
import ExpedicaoPage from './pages/ExpedicaoPage';
import MissoesPage from './pages/MissoesPage';
import CadastroPage from './pages/CadastroPage';
import RelatoriosPage from './pages/RelatoriosPage';
import LoginPage from './pages/LoginPage';
import ApontamentoPage from './pages/ApontamentoPage';
import EstoquePage from './pages/EstoquePage';
import OperadorPage from './pages/OperadorPage';
import ConfigImportacaoPage from './pages/ConfigImportacaoPage';
import ImportacaoPage from './pages/ImportacaoPage';
import { WMSProvider, useWMS } from './context/WMSContext';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AppContent: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { isLoading, connectionError } = useWMS();

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800">Carregando Sistema WMS...</h2>
                    <p className="text-gray-500 mt-2">Conectando ao banco de dados...</p>
                </div>
            </div>
        );
    }

    if (connectionError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center border border-red-200">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-700 mb-2">Erro de Conexão</h2>
                    <p className="text-gray-600 mb-6">{connectionError}</p>
                    <div className="bg-gray-100 p-4 rounded-md text-left text-sm font-mono text-gray-700 mb-6">
                        <p><strong>Dica:</strong> Verifique se o servidor backend está rodando.</p>
                        <p className="mt-2">1. Abra o terminal.</p>
                        <p>2. Digite: <code>npm run start:all</code></p>
                        <p>3. Aguarde a mensagem "Servidor WMS Backend rodando".</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <Routes>
                {!isAuthenticated ? (
                     <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                ) : (
                    <Route element={<Layout onLogout={handleLogout} />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/operador" element={<OperadorPage />} />
                        <Route path="/recebimento" element={<RecebimentoPage />} />
                        <Route path="/apontamento" element={<ApontamentoPage />} />
                        <Route path="/armazenagem" element={<ArmazenagemPage />} />
                        <Route path="/estoque" element={<EstoquePage />} />
                        <Route path="/pedidos" element={<PedidosPage />} />
                        <Route path="/picking" element={<PickingPage />} />
                        <Route path="/conferencia" element={<ConferenciaPage />} />
                        <Route path="/expedicao" element={<ExpedicaoPage />} />
                        <Route path="/missoes" element={<MissoesPage />} />
                        <Route path="/cadastros" element={<CadastroPage />} />
                        <Route path="/relatorios" element={<RelatoriosPage />} />
                        <Route path="/config-importacao" element={<ConfigImportacaoPage />} />
                        <Route path="/importacao" element={<ImportacaoPage />} />
                    </Route>
                )}
                 <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </HashRouter>
    );
};

const App: React.FC = () => {
    return (
        <WMSProvider>
            <AppContent />
        </WMSProvider>
    );
};

export default App;