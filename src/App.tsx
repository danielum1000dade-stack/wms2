
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
import { ArrowPathIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const AppContent: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { isLoading, isOffline } = useWMS();

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
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            {isOffline && (
                <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 px-4 py-1 text-xs font-medium text-center flex justify-center items-center">
                    <SignalSlashIcon className="h-3 w-3 mr-1"/>
                    Modo Offline Ativo — Backend não detectado. Os dados estão sendo salvos apenas no navegador.
                </div>
            )}
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
