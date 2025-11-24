
import React, { useState } from 'react';
// FIX: Imported Outlet from react-router-dom to render nested routes.
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, Bars3Icon, BuildingStorefrontIcon, CubeIcon, InboxStackIcon, MapIcon, PowerIcon, QrCodeIcon, ClipboardDocumentListIcon, DocumentChartBarIcon, TruckIcon, CheckBadgeIcon, Cog6ToothIcon, XMarkIcon, ChevronDownIcon, CubeTransparentIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
    onLogout: () => void;
}

// FIX: Removed `children` from props as it's not passed directly when using react-router v6 layout routes. Child components are rendered via `<Outlet />`.
const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { path: '/dashboard', icon: BuildingStorefrontIcon, label: 'Dashboard' },
        { path: '/operador', icon: DevicePhoneMobileIcon, label: 'Modo Operador' },
        { path: '/recebimento', icon: InboxStackIcon, label: 'Recebimento' },
        { path: '/apontamento', icon: QrCodeIcon, label: 'Apontamento' },
        { path: '/armazenagem', icon: MapIcon, label: 'Armazenagem' },
        { path: '/estoque', icon: CubeTransparentIcon, label: 'Estoque' },
        { path: '/pedidos', icon: ClipboardDocumentListIcon, label: 'Pedidos' },
        { path: '/picking', icon: CubeIcon, label: 'Picking' },
        { path: '/conferencia', icon: CheckBadgeIcon, label: 'Conferência' },
        { path: '/expedicao', icon: TruckIcon, label: 'Expedição' },
        { path: '/missoes', icon: DocumentChartBarIcon, label: 'Missões' },
        { path: '/cadastros', icon: Cog6ToothIcon, label: 'Cadastros' },
        { path: '/relatorios', icon: DocumentChartBarIcon, label: 'Relatórios' },
    ];
    
    const currentPage = navLinks.find(link => location.pathname.startsWith(link.path))?.label || 'Dashboard';

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white shadow-lg">
            <div className="flex items-center justify-center h-20 border-b">
                <CubeIcon className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-2xl font-bold text-gray-800">WMS Pro</span>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navLinks.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        onClick={() => isSidebarOpen && setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`
                        }
                    >
                        <Icon className="h-6 w-6 mr-3" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="px-4 py-4 border-t">
                 <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
                >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
                    Sair
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 w-0 overflow-hidden">
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm lg:hidden">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 focus:outline-none lg:hidden"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <span className="ml-4 text-xl font-semibold text-gray-800">{currentPage}</span>
                    </div>
                    <div className="flex items-center">
                         <CubeIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
