
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
import OperadorPage from './pages/OperadorPage'; // Import new page
import { WMSProvider } from './context/WMSContext';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    }

    return (
        <WMSProvider>
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
                        </Route>
                    )}
                     <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                </Routes>
            </HashRouter>
        </WMSProvider>
    );
};

export default App;
