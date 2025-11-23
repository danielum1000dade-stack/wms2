
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { Pedido, SKU, Conferencia, PedidoItem, ConferenciaErroTipo } from '../types';
import { InboxIcon, PlayCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type ConferenceItemStatus = 'pending' | 'match' | 'mismatch';
type ConfirmedQuantities = Record<string, { counted: number | '', reason?: ConferenciaErroTipo }>;


const ActiveConferenciaView: React.FC<{
    activeConferencia: { conferencia: Conferencia, pedido: Pedido };
    onFinish: (conferenciaId: string, confirmedQuantities: ConfirmedQuantities) => void;
}> = ({ activeConferencia, onFinish }) => {
    const { skus } = useWMS();
    const { conferencia, pedido } = activeConferencia;
    
    const [confirmedQuantities, setConfirmedQuantities] = useState<ConfirmedQuantities>({});

    const handleQuantityChange = (key: string, value: string) => {
        const numValue = value === '' ? '' : parseInt(value, 10);
        if (numValue === '' || (!isNaN(numValue) && numValue >= 0)) {
            setConfirmedQuantities(prev => ({ ...prev, [key]: { ...prev[key], counted: numValue } }));
        }
    };
    
    const handleReasonChange = (key: string, reason: ConferenciaErroTipo) => {
        setConfirmedQuantities(prev => ({ ...prev, [key]: { ...prev[key], reason } }));
    };

    const getItemStatus = (item: PedidoItem, key: string): ConferenceItemStatus => {
        const confirmed = confirmedQuantities[key];
        if (confirmed?.counted === '' || confirmed?.counted === undefined) {
            return 'pending';
        }
        return confirmed.counted === item.quantidadeCaixas ? 'match' : 'mismatch';
    };

    const statusStyles: Record<ConferenceItemStatus, string> = {
        pending: 'border-gray-300',
        match: 'border-green-500 bg-green-50',
        mismatch: 'border-yellow-500 bg-yellow-50',
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-indigo-500">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Conferindo Transporte: {pedido.numeroTransporte}</h2>
                    <p className="text-sm text-gray-500">Iniciado em: {new Date(conferencia.startedAt).toLocaleString()}</p>
                </div>
                <button 
                    onClick={() => onFinish(conferencia.id, confirmedQuantities)} 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                    <CheckCircleIcon className="h-5 w-5 mr-2" /> Finalizar Conferência
                </button>
            </div>

            <div className="space-y-3">
                {pedido.items.map(item => {
                    const sku = skus.find(s => s.sku === item.sku);
                    if (!sku) return null;
                    const key = `${sku.id}|${item.lote}`;
                    const status = getItemStatus(item, key);
                    const confirmed = confirmedQuantities[key];

                    return (
                        <div key={key} className={`p-4 rounded-lg border-l-4 transition-colors ${statusStyles[status]}`}>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                <div className="flex-1">
                                    <p className="font-bold text-lg text-gray-800">{sku.descritivo}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                        <span>SKU: <span className="font-semibold">{sku.sku}</span></span>
                                        <span>Lote: <span className="font-semibold">{item.lote}</span></span>
                                        <span>Esperado: <span className="font-semibold">{item.quantidadeCaixas} cx</span></span>
                                    </div>
                                </div>
                                <div className="mt-3 md:mt-0 md:ml-4 flex items-center gap-2">
                                    <label htmlFor={`qty-${key}`} className="text-sm font-medium">Contado:</label>
                                    <input
                                        id={`qty-${key}`}
                                        type="number"
                                        value={confirmed?.counted ?? ''}
                                        onChange={(e) => handleQuantityChange(key, e.target.value)}
                                        className="w-24 text-center text-lg font-bold p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            {status === 'mismatch' && Number(confirmed?.counted) < item.quantidadeCaixas && (
                                <div className="mt-2 pt-2 border-t border-yellow-200">
                                    <label className="text-xs font-semibold text-yellow-800">Motivo da Falta:</label>
                                    <div className="flex gap-4 mt-1">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name={`reason-${key}`} value={ConferenciaErroTipo.FALTA}
                                                checked={confirmed?.reason === ConferenciaErroTipo.FALTA || !confirmed?.reason}
                                                onChange={() => handleReasonChange(key, ConferenciaErroTipo.FALTA)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300"
                                            />
                                            <span className="ml-2">Falta de Produto</span>
                                        </label>
                                         <label className="flex items-center text-sm">
                                            <input type="radio" name={`reason-${key}`} value={ConferenciaErroTipo.AVARIA}
                                                checked={confirmed?.reason === ConferenciaErroTipo.AVARIA}
                                                onChange={() => handleReasonChange(key, ConferenciaErroTipo.AVARIA)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300"
                                            />
                                            <span className="ml-2">Avaria / Danificado</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ConferenciaPage: React.FC = () => {
    const { pedidos, startConferencia, getActiveConferencia, finishConferencia } = useWMS();
    const currentUserId = 'admin_user';
    const [feedback, setFeedback] = useState<string | null>(null);


    const activeConferencia = useMemo(() => {
        const active = getActiveConferencia(currentUserId);
        if (!active) return null;
        return { conferencia: active.conferencia, pedido: active.pedido };
    }, [pedidos, getActiveConferencia, currentUserId]);


    const pendingPedidos = useMemo(() => {
        return pedidos.filter(p => p.status === 'Separado' || p.status === 'Aguardando Ressuprimento');
    }, [pedidos]);

    const handleStart = (pedidoId: string) => {
        setFeedback(null);
        startConferencia(pedidoId, currentUserId);
    };

    const handleFinish = (conferenciaId: string, confirmedQuantities: ConfirmedQuantities) => {
        if (window.confirm("Tem certeza que deseja finalizar esta conferência? O sistema irá analisar as divergências e criar tarefas de ressuprimento se necessário.")) {
             const result = finishConferencia(conferenciaId, confirmedQuantities);
             setFeedback(result.message);
             setTimeout(() => setFeedback(null), 7000);
        }
    };
    
    if (activeConferencia) {
        return (
            <div className="space-y-4">
                {feedback && (
                    <div className="p-4 rounded-md bg-blue-100 text-blue-800">
                        <strong>Atualização:</strong> {feedback}
                    </div>
                )}
                <ActiveConferenciaView activeConferencia={activeConferencia} onFinish={handleFinish} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Conferência de Pedidos</h1>
             {feedback && (
                <div className="p-4 rounded-md bg-blue-100 text-blue-800">
                   <strong>Atualização:</strong> {feedback}
                </div>
            )}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Pedidos Aguardando Conferência</h2>
                {pendingPedidos.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
                        <InboxIcon className="mx-auto h-12 w-12 text-gray-400"/>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido para conferir</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Aguardando a finalização da separação dos pedidos.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Transporte</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pendingPedidos.map(pedido => (
                                    <tr key={pedido.id}>
                                        <td className="px-6 py-4 font-medium">{pedido.numeroTransporte}</td>
                                        <td className="px-6 py-4">{pedido.items.length}</td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pedido.status === 'Aguardando Ressuprimento' ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {pedido.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(pedido.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleStart(pedido.id)} className="flex items-center justify-end ml-auto bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm">
                                                <PlayCircleIcon className="h-4 w-4 mr-1"/> {pedido.status === 'Aguardando Ressuprimento' ? 'Continuar' : 'Iniciar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConferenciaPage;
