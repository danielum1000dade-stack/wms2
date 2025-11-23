


import React, { useState } from 'react';
// FIX: Imported Outlet from react-router-dom to render nested routes.
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, Bars3Icon, BuildingStorefrontIcon, CubeIcon, InboxStackIcon, MapIcon, PowerIcon, QrCodeIcon, ClipboardDocumentListIcon, DocumentChartBarIcon, TruckIcon, CheckBadgeIcon, Cog6ToothIcon, XMarkIcon, ChevronDownIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
    onLogout: () => void;
}

// FIX: Removed `children` from props as it's not passed directly when using react-router v6 layout routes. Child components are rendered via `<Outlet />`.
const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { path: '/dashboard', icon: BuildingStorefrontIcon, label: 'Dashboard' },
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
            <nav className="flex-1 px-4 py-6 space-y-2">
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
                    <PowerIcon className="w-6 h-6 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );


    return (
         <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-shrink-0 w-64">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="relative w-64 max-w-xs flex-1">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            type="button"
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Close sidebar</span>
                            <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </button>
                    </div>
                    <SidebarContent />
                </div>
                <div className="flex-shrink-0 w-14" aria-hidden="true" onClick={() => setSidebarOpen(false)}>
                    {/* Dummy element to close sidebar on outside click */}
                </div>
            </div>

            <div className="flex flex-col flex-1 w-0 overflow-hidden">
                <header className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow lg:hidden">
                    <button
                        type="button"
                        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex-1 px-4 flex justify-between items-center">
                         <h1 className="text-xl font-semibold text-gray-900">{currentPage}</h1>
                    </div>
                </header>
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* FIX: Replaced duplicated routing logic with <Outlet /> to render child routes. This fixes all errors for missing components and routing elements. */}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;