import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { Pedido } from '../types';
import ImportExcelModal from '../components/ImportExcelModal';
import { ArrowUpTrayIcon, CubeIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

const PedidosPage: React.FC = () => {
    const { pedidos, processTransportData, generateMissionsForPedido } = useWMS();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleImport = (data: any[]) => {
        const result = processTransportData(data);
        setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
        setTimeout(() => setFeedback(null), 5000);
    };

    const handleGenerateMissions = (pedidoId: string) => {
        const result = generateMissionsForPedido(pedidoId);
        setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
        setTimeout(() => setFeedback(null), 5000);
    }

    const columnConfig = {
        'Nº transporte': { type: 'string', required: true },
        'Cód.Item': { type: 'string', required: true },
        'Descrição do Produto': { type: 'string', required: true },
        'Lote': { type: 'string', required: true },
        'Unid.Armaz.': { type: 'string', required: false },
        'Total(Unid.Vda.)': { type: 'number', required: false },
        'Unid.Exp.(Caixa)': { type: 'number', required: true },
        'Unid.Exp.(Fração)': { type: 'number', required: false },
        'Peso Bruto': { type: 'number', required: false },
        'Peso Líquido': { type: 'number', required: false },
    };

    const getStatusClass = (status: Pedido['status']) => {
        switch (status) {
            case 'Pendente': return 'bg-gray-100 text-gray-800';
            case 'Em Separação': return 'bg-yellow-100 text-yellow-800';
            case 'Separado': return 'bg-blue-100 text-blue-800';
            case 'Conferido': return 'bg-green-100 text-green-800';
            case 'Expedido': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos de Transporte</h1>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Importar Pedidos
                </button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-md ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.message}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Transporte</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Importação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pedidos.length > 0 ? pedidos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(pedido => (
                                <tr key={pedido.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.numeroTransporte}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.items.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(pedido.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pedido.status)}`}>
                                            {pedido.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {pedido.status === 'Pendente' && (
                                            <button
                                                onClick={() => handleGenerateMissions(pedido.id)}
                                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                                            >
                                               <PlayCircleIcon className="h-5 w-5"/> Processar e Gerar Missões
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        <CubeIcon className="mx-auto h-12 w-12 text-gray-400"/>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido encontrado</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Importe um novo arquivo de pedidos para começar.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isImportModalOpen && (
                <ImportExcelModal
                    title="Importar Arquivo de Transporte"
                    columnConfig={columnConfig}
                    onImport={handleImport}
                    onClose={() => setIsImportModalOpen(false)}
                />
            )}
        </div>
    );
};

export default PedidosPage;