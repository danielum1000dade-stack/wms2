
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { Pedido, SKU, Conferencia, ConferenciaItem, ConferenciaErroTipo } from '../types';
import { CheckBadgeIcon, InboxIcon, PlayCircleIcon, CheckCircleIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import SKUModal from '../components/SKUModal';


// Modal for reporting errors
const ErrorModal: React.FC<{
    onClose: () => void;
    onSubmit: (errorData: { tipo: ConferenciaErroTipo, skuId: string, lote: string, quantidade: number, observacao: string }) => void;
    pedidoItems: { sku: SKU, lote: string }[];
}> = ({ onClose, onSubmit, pedidoItems }) => {
    const [tipo, setTipo] = useState<ConferenciaErroTipo>(ConferenciaErroTipo.PRODUTO_DIVERGENTE);
    const [skuId, setSkuId] = useState('');
    const [lote, setLote] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [observacao, setObservacao] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!skuId) {
            alert("Selecione um SKU.");
            return;
        }
        onSubmit({ tipo, skuId, lote, quantidade, observacao });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-lg font-medium">Reportar Divergência na Conferência</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Erro</label>
                    <select value={tipo} onChange={e => setTipo(e.target.value as ConferenciaErroTipo)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3">
                        {Object.values(ConferenciaErroTipo).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Produto</label>
                    <select value={skuId} onChange={e => {
                        const [id, l] = e.target.value.split('|');
                        setSkuId(id);
                        setLote(l);
                    }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3">
                        <option value="">Selecione um produto...</option>
                        {pedidoItems.map(({ sku, lote }, i) => <option key={`${sku.id}-${i}`} value={`${sku.id}|${lote}`}>{sku.sku} - {sku.descritivo} (Lote: {lote})</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade Divergente</label>
                    <input type="number" min="1" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Observação</label>
                    <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3" />
                </div>
                 <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Salvar Erro</button>
                </div>
            </form>
        </div>
    );
};


// Main view for active conference
const ActiveConferenciaView: React.FC<{
    activeConferencia: { conferencia: Conferencia, pedido: Pedido, items: ConferenciaItem[] };
    onFinish: () => void;
}> = ({ activeConferencia, onFinish }) => {
    const { skus, recordConferenciaItem, reportConferenciaError, getEtiquetaById, conferenciaErros, industrias, tiposBloqueio, addSku } = useWMS();
    const { conferencia, pedido, items } = activeConferencia;
    
    const [skuInput, setSkuInput] = useState('');
    const [loteInput, setLoteInput] = useState('');
    const [qtyInput, setQtyInput] = useState<number | ''>('');
    const [foundSku, setFoundSku] = useState<SKU | null>(null);
    const [error, setError] = useState('');
    const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    const handleSkuBlur = () => {
        if (!skuInput) {
            setFoundSku(null);
            return;
        }
        const sku = skus.find(s => s.sku.toLowerCase() === skuInput.toLowerCase());
        if (sku) {
            setFoundSku(sku);
            setError('');
        } else {
            setFoundSku(null);
            setError('SKU não encontrado no pedido.');
        }
    };
    
    const handleAddItem = () => {
        setError('');
        if (!foundSku) {
            setError('SKU inválido ou não encontrado.');
            return;
        }
        if (!loteInput.trim()) {
            setError('Lote é obrigatório.');
            return;
        }
        if (Number(qtyInput) <= 0) {
            setError('Quantidade deve ser maior que zero.');
            return;
        }
        
        recordConferenciaItem({
            conferenciaId: conferencia.id,
            skuId: foundSku.id,
            lote: loteInput,
            quantidadeContada: Number(qtyInput),
        });

        // Reset form
        setSkuInput('');
        setLoteInput('');
        setQtyInput('');
        setFoundSku(null);
    };

    const handleReportError = (errorData: { tipo: ConferenciaErroTipo, skuId: string, lote: string, quantidade: number, observacao: string }) => {
        reportConferenciaError({
            conferenciaId: conferencia.id,
            pedidoId: pedido.id,
            skuId: errorData.skuId,
            lote: errorData.lote,
            tipo: errorData.tipo,
            quantidadeDivergente: errorData.quantidade,
            observacao: errorData.observacao,
            conferenteId: conferencia.conferenteId
        });
    };

    const pedidoItemsWithSku = useMemo(() => 
        pedido.items.map(item => ({
            sku: skus.find(s => s.sku === item.sku)!,
            lote: item.lote
        })).filter(item => item.sku), 
    [pedido.items, skus]);

    const errosDaConferencia = conferenciaErros.filter(e => e.conferenciaId === conferencia.id);

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-indigo-500">
            {isErrorModalOpen && <ErrorModal onClose={() => setIsErrorModalOpen(false)} onSubmit={handleReportError} pedidoItems={pedidoItemsWithSku}/>}

            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Conferindo Transporte: {pedido.numeroTransporte}</h2>
                    <p className="text-sm text-gray-500">Iniciado em: {new Date(conferencia.startedAt).toLocaleString()}</p>
                </div>
                <button onClick={onFinish} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" /> Finalizar Conferência
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Input Panel */}
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                         <h3 className="font-semibold text-gray-700">Contagem de Itens</h3>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">SKU</label>
                            <input type="text" value={skuInput} onChange={e => setSkuInput(e.target.value)} onBlur={handleSkuBlur} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            {foundSku && <p className="text-xs text-green-700 mt-1">✓ {foundSku.descritivo}</p>}
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Lote</label>
                                <input type="text" value={loteInput} onChange={e => setLoteInput(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                                <input type="number" value={qtyInput} onChange={e => setQtyInput(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                         </div>
                          {error && <p className="text-sm text-red-600">{error}</p>}
                         <button onClick={handleAddItem} className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                             <PlusIcon className="h-5 w-5 mr-2"/> Confirmar Item
                         </button>
                    </div>
                    <button onClick={() => setIsErrorModalOpen(true)} className="w-full flex items-center justify-center bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" /> Reportar Divergência
                    </button>
                </div>
                {/* Counted Items Panel */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-gray-700">Itens Conferidos ({items.length})</h3>
                    <div className="p-2 border rounded-lg space-y-2 max-h-48 overflow-y-auto">
                        {items.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">Nenhum item conferido ainda.</p> :
                            items.map(item => {
                                const sku = skus.find(s => s.id === item.skuId);
                                return (
                                <div key={item.id} className="p-2 bg-white rounded-md shadow-sm">
                                    <p className="font-medium">{sku?.descritivo}</p>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>SKU: {sku?.sku} | Lote: {item.lote}</span>
                                        <span className="font-bold">{item.quantidadeContada} cx</span>
                                    </div>
                                </div>
                            )})
                        }
                    </div>
                     <h3 className="font-semibold text-gray-700 mt-2">Divergências Reportadas ({errosDaConferencia.length})</h3>
                     <div className="p-2 border rounded-lg space-y-2 max-h-48 overflow-y-auto">
                        {errosDaConferencia.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">Nenhuma divergência reportada.</p> :
                            errosDaConferencia.map(err => {
                                const sku = skus.find(s => s.id === err.skuId);
                                return (
                                <div key={err.id} className="p-2 bg-red-50 rounded-md">
                                    <p className="font-medium text-red-800">{err.tipo}: {err.quantidadeDivergente} cx</p>
                                    <p className="text-sm text-red-700">{sku?.sku} - {sku?.descritivo}</p>
                                </div>
                            )})
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};


const ConferenciaPage: React.FC = () => {
    const { pedidos, startConferencia, getActiveConferencia, finishConferencia } = useWMS();
    const currentUserId = 'admin_user';

    const activeConferencia = useMemo(() => getActiveConferencia(currentUserId), [getActiveConferencia, currentUserId]);

    const pendingPedidos = useMemo(() => {
        return pedidos.filter(p => p.status === 'Separado');
    }, [pedidos]);

    const handleStart = (pedidoId: string) => {
        startConferencia(pedidoId, currentUserId);
    };

    const handleFinish = () => {
        if (activeConferencia) {
            if (window.confirm("Tem certeza que deseja finalizar esta conferência? Itens do pedido que não foram contados serão registrados como 'Falta'.")) {
                 finishConferencia(activeConferencia.conferencia.id);
            }
        }
    };
    
    if (activeConferencia) {
        return <ActiveConferenciaView activeConferencia={activeConferencia} onFinish={handleFinish} />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Conferência de Pedidos</h1>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pendingPedidos.map(pedido => (
                                    <tr key={pedido.id}>
                                        <td className="px-6 py-4 font-medium">{pedido.numeroTransporte}</td>
                                        <td className="px-6 py-4">{pedido.items.length}</td>
                                        <td className="px-6 py-4">{new Date(pedido.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleStart(pedido.id)} className="flex items-center justify-end ml-auto bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm">
                                                <PlayCircleIcon className="h-4 w-4 mr-1"/> Iniciar
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
