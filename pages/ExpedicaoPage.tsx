import React from 'react';
import { useWMS } from '../context/WMSContext';
import { Pedido } from '../types';
import { TruckIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const ExpedicaoPage: React.FC = () => {
    const { pedidos, updatePedido } = useWMS();

    const pedidosConferidos = pedidos.filter(p => p.status === 'Conferido');

    const handleExpedir = (pedidoId: string) => {
        if (window.confirm("Tem certeza que deseja marcar este pedido como expedido? Esta ação não pode ser desfeita.")) {
            updatePedido(pedidoId, { status: 'Expedido' });
        }
    };

    const getStatusClass = (status: Pedido['status']) => {
        switch (status) {
            case 'Conferido': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Expedição</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pedidos Prontos para Carregamento</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Transporte</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pedidosConferidos.length > 0 ? pedidosConferidos.map(pedido => (
                                <tr key={pedido.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.numeroTransporte}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.items.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pedido.status)}`}>
                                            <CheckBadgeIcon className="h-4 w-4 mr-1"/>
                                            {pedido.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleExpedir(pedido.id)}
                                            className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
                                        >
                                           <TruckIcon className="h-5 w-5"/> Expedir
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">
                                        <TruckIcon className="mx-auto h-12 w-12 text-gray-400"/>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido conferido</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Aguardando a finalização da conferência dos pedidos.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpedicaoPage;
