
import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { Pedido } from '../types';
import ImportExcelModal from '../components/ImportExcelModal';
import { ArrowUpTrayIcon, CubeIcon, PlayCircleIcon, StarIcon as StarSolidIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';


// FIX: Defined ColumnConfig interface locally to ensure type safety for excel import configurations.
interface ColumnConfig {
    [key: string]: {
        type: 'string' | 'number';
        required: boolean;
        enum?: string[];
    };
}

const PedidosPage: React.FC = () => {
    const { pedidos, processTransportData, generateMissionsForPedido, updatePedido, reabrirSeparacao } = useWMS();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [reopenModalState, setReopenModalState] = useState<{ isOpen: boolean, pedido: Pedido | null }>({ isOpen: false, pedido: null });
    const [reopenReason, setReopenReason] = useState('');

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
    
    const handleOpenReopenModal = (pedido: Pedido) => {
        setReopenReason('');
        setReopenModalState({ isOpen: true, pedido });
    };

    const handleConfirmReopen = () => {
        if (!reopenModalState.pedido) return;
        if (!reopenReason.trim()) {
            alert("O motivo é obrigatório.");
            return;
        }
        const result = reabrirSeparacao(reopenModalState.pedido.id, reopenReason);
        setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
        setReopenModalState({ isOpen: false, pedido: null });
        setTimeout(() => setFeedback(null), 5000);
    };


    // FIX: Explicitly typed column config to match expected prop type in ImportExcelModal.
    const columnConfig: ColumnConfig = {
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
            case 'Em Conferência': return 'bg-orange-100 text-orange-800';
            case 'Aguardando Ressuprimento': return 'bg-cyan-100 text-cyan-800';
            case 'Conferência Parcial': return 'bg-yellow-100 text-yellow-800 font-bold';
            case 'Conferido': return 'bg-green-100 text-green-800';
            case 'Expedido': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const canReabrir = (status: Pedido['status']) => {
        const statusesPermitidos: Pedido['status'][] = ['Separado', 'Em Conferência', 'Conferência Parcial', 'Conferido', 'Aguardando Ressuprimento'];
        return statusesPermitidos.includes(status);
    }

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
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Transporte</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Importação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pedidos.length > 0 ? pedidos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(pedido => (
                                <tr key={pedido.id} className={pedido.priority ? 'bg-yellow-50' : ''}>
                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                        <button onClick={() => updatePedido(pedido.id, !pedido.priority)} title="Marcar como prioritário">
                                            {pedido.priority ? <StarSolidIcon className="h-6 w-6 text-yellow-500"/> : <StarOutlineIcon className="h-6 w-6 text-gray-400 hover:text-yellow-500"/>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.numeroTransporte}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.items.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(pedido.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pedido.status)}`}>
                                            {pedido.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-4">
                                        {pedido.status === 'Pendente' && (
                                            <button
                                                onClick={() => handleGenerateMissions(pedido.id)}
                                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                                            >
                                               <PlayCircleIcon className="h-5 w-5"/> Processar
                                            </button>
                                        )}
                                        {canReabrir(pedido.status) && (
                                             <button
                                                onClick={() => handleOpenReopenModal(pedido)}
                                                className="flex items-center gap-1 text-red-600 hover:text-red-900"
                                                title="Reabrir o pedido, excluindo as missões geradas e retornando-o para 'Pendente'"
                                            >
                                               <ArrowPathIcon className="h-5 w-5"/> Refazer Separação
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
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

            {reopenModalState.isOpen && reopenModalState.pedido && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Refazer Separação</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Você está prestes a reabrir o pedido <span className="font-bold">{reopenModalState.pedido.numeroTransporte}</span>.
                            Por favor, informe o motivo.
                        </p>
                        <div>
                            <label htmlFor="reopen-reason" className="block text-sm font-medium text-gray-700">Motivo (Obrigatório)</label>
                            <textarea
                                id="reopen-reason"
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                            <button type="button" onClick={() => setReopenModalState({ isOpen: false, pedido: null })} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                            <button type="button" onClick={handleConfirmReopen} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirmar Reabertura</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PedidosPage;
