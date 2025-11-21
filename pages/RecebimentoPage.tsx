
import React, { useState, useEffect } from 'react';
import { useWMS } from '../context/WMSContext';
import { Recebimento, Etiqueta, EtiquetaStatus } from '../types';
import { PlusIcon, PrinterIcon, TrashIcon, ChevronDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import EtiquetasImprimir from '../components/EtiquetasImprimir';
import DivergenciaModal from '../components/DivergenciaModal';

const RecebimentoPage: React.FC = () => {
    const { recebimentos, addRecebimento, getEtiquetasByRecebimento, deleteEtiqueta, deleteEtiquetas } = useWMS();
    const [view, setView] = useState<'list' | 'print'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecebimento, setCurrentRecebimento] = useState<Recebimento | null>(null);
    const [etiquetasParaImprimir, setEtiquetasParaImprimir] = useState<Etiqueta[]>([]);
    const [expandedRecebimentoId, setExpandedRecebimentoId] = useState<string | null>(null);
    const [divergenciaModalOpen, setDivergenciaModalOpen] = useState(false);
    const [recebimentoParaDivergencia, setRecebimentoParaDivergencia] = useState<Recebimento | null>(null);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleOpenDivergenciaModal = (recebimento: Recebimento) => {
        setRecebimentoParaDivergencia(recebimento);
        setDivergenciaModalOpen(true);
    }

    const handleCloseDivergenciaModal = () => {
        setRecebimentoParaDivergencia(null);
        setDivergenciaModalOpen(false);
    }

    const handleSaveRecebimento = (
        formData: Omit<Recebimento, 'id' | 'dataHoraChegada' | 'etiquetasGeradas'>, 
        etiquetasCount: number
    ) => {
        const { newRecebimento, newEtiquetas } = addRecebimento({
            ...formData,
            etiquetasGeradas: etiquetasCount,
            dataHoraChegada: new Date().toISOString(),
        }, etiquetasCount);

        if (newRecebimento && newEtiquetas.length > 0) {
            handlePrepareToPrint(newEtiquetas, newRecebimento);
        }

        handleCloseModal();
    };
    
    const handlePrepareToPrint = (etiquetas: Etiqueta[], recebimento: Recebimento) => {
        setEtiquetasParaImprimir(etiquetas);
        setCurrentRecebimento(recebimento);
        setView('print');
    }

    const handleFinishPrinting = () => {
        setView('list');
        setCurrentRecebimento(null);
        setEtiquetasParaImprimir([]);
    }
    
    const handleDeleteEtiqueta = (etiqueta: Etiqueta) => {
        if (window.confirm(`Tem certeza que deseja excluir a etiqueta ${etiqueta.id}?`)) {
            const result = deleteEtiqueta(etiqueta.id);
            if (!result.success) {
                alert(result.message || 'Ocorreu um erro ao excluir a etiqueta.');
            }
        }
    }
    
    const handleDeletePendentes = (etiquetasParaExcluir: Etiqueta[]) => {
        if (etiquetasParaExcluir.length === 0) return;

        if (window.confirm(`Tem certeza que deseja excluir ${etiquetasParaExcluir.length} etiqueta(s) pendente(s) deste recebimento? Esta ação não pode ser desfeita.`)) {
            const idsParaExcluir = etiquetasParaExcluir.map(e => e.id);
            const result = deleteEtiquetas(idsParaExcluir);
            if (!result.success) {
                alert(result.message || 'Ocorreu um erro ao excluir as etiquetas.');
            }
        }
    };


    if (view === 'print' && currentRecebimento) {
        return (
            <EtiquetasImprimir 
                recebimento={currentRecebimento} 
                etiquetas={etiquetasParaImprimir} 
                onBack={handleFinishPrinting}
            />
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Recebimentos</h1>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2" /> Novo Recebimento
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Fiscal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiquetas</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recebimentos.map(r => {
                                const isExpanded = expandedRecebimentoId === r.id;
                                const etiquetasDoRecebimento = getEtiquetasByRecebimento(r.id);
                                const etiquetasPendentes = etiquetasDoRecebimento.filter(et => et.status === EtiquetaStatus.PENDENTE_APONTAMENTO);

                                return (
                                    <React.Fragment key={r.id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <button onClick={() => setExpandedRecebimentoId(isExpanded ? null : r.id)}>
                                                    <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.notaFiscal}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.fornecedor}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.placaVeiculo}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.dataHoraChegada).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etiquetasDoRecebimento.length}</td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <div className="p-4 bg-gray-50">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-semibold text-gray-700">Etiquetas do Recebimento {r.notaFiscal}</h4>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => handleOpenDivergenciaModal(r)}
                                                                    className="flex items-center text-sm bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600">
                                                                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" /> Gerenciar Divergências
                                                                </button>
                                                                <button 
                                                                    onClick={() => handlePrepareToPrint(etiquetasDoRecebimento, r)}
                                                                    className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">
                                                                    <PrinterIcon className="h-4 w-4 mr-1" /> Imprimir Todas
                                                                </button>
                                                                {etiquetasPendentes.length > 0 && (
                                                                    <button
                                                                        onClick={() => handleDeletePendentes(etiquetasPendentes)}
                                                                        className="flex items-center text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                                                        title={`Excluir ${etiquetasPendentes.length} etiqueta(s) pendente(s)`}
                                                                    >
                                                                        <TrashIcon className="h-4 w-4 mr-1" /> Excluir Pendentes ({etiquetasPendentes.length})
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto border rounded-md">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">ID Etiqueta</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Ações</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {etiquetasDoRecebimento.map(et => (
                                                                        <tr key={et.id}>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">{et.id}</td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${et.status === EtiquetaStatus.PENDENTE_APONTAMENTO ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                                                    {et.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                                                <button onClick={() => handlePrepareToPrint([et], r)} className="text-indigo-600 hover:text-indigo-900" title="Imprimir Etiqueta"><PrinterIcon className="h-5 w-5"/></button>
                                                                                <button 
                                                                                    onClick={() => handleDeleteEtiqueta(et)} 
                                                                                    className={`text-red-600 hover:text-red-900 ${et.status !== EtiquetaStatus.PENDENTE_APONTAMENTO ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                                    disabled={et.status !== EtiquetaStatus.PENDENTE_APONTAMENTO}
                                                                                    title={et.status !== EtiquetaStatus.PENDENTE_APONTAMENTO ? "Não pode excluir, status não é pendente" : "Excluir Etiqueta"}
                                                                                    >
                                                                                        <TrashIcon className="h-5 w-5"/>
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <RecebimentoFormModal onSave={handleSaveRecebimento} onClose={handleCloseModal} />
            )}
            {divergenciaModalOpen && recebimentoParaDivergencia && (
                <DivergenciaModal
                    recebimento={recebimentoParaDivergencia}
                    onClose={handleCloseDivergenciaModal}
                />
            )}
        </div>
    );
};


const RecebimentoFormModal: React.FC<{
    onSave: (formData: any, etiquetasCount: number) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const { industrias } = useWMS();
    const [formData, setFormData] = useState({
        placaVeiculo: '',
        fornecedor: '',
        notaFiscal: '',
        temperaturaVeiculo: '',
        transportador: '',
        lacre: '',
        doca: '',
        temperaturaTermoKing: '',
    });
    const [etiquetasGeradas, setEtiquetasGeradas] = useState(1);
    
    useEffect(() => {
        if (industrias.length > 0 && !formData.fornecedor) {
            setFormData(prev => ({ ...prev, fornecedor: industrias[0].nome }));
        }
    }, [industrias, formData.fornecedor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberInput = (e.target as HTMLInputElement).type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumberInput && value !== '' ? parseFloat(value) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData }, etiquetasGeradas);
    };

    return (
        <Modal title="Novo Recebimento" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campos do Recebimento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Placa do Veículo</label>
                        <input type="text" name="placaVeiculo" value={formData.placaVeiculo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nota Fiscal</label>
                        <input type="text" name="notaFiscal" value={formData.notaFiscal} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fornecedor (Origem)</label>
                        <select
                            name="fornecedor"
                            value={formData.fornecedor}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white"
                        >
                            {industrias.length === 0 ? (
                                <option value="" disabled>Cadastre uma indústria primeiro</option>
                            ) : (
                                industrias.map(i => (
                                    <option key={i.id} value={i.nome}>{i.nome}</option>
                                ))
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Transportador</label>
                        <input type="text" name="transportador" value={formData.transportador} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lacre</label>
                        <input type="text" name="lacre" value={formData.lacre} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Doca</label>
                        <input type="text" name="doca" value={formData.doca} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Temp. Baú (°C)</label>
                        <input type="number" step="0.1" name="temperaturaVeiculo" value={formData.temperaturaVeiculo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Temp. TermoKing (°C)</label>
                        <input type="number" step="0.1" name="temperaturaTermoKing" value={formData.temperaturaTermoKing} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Qtd. Etiquetas</label>
                        <input type="number" min="1" name="etiquetasGeradas" value={etiquetasGeradas} onChange={(e) => setEtiquetasGeradas(parseInt(e.target.value, 10))} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar e Gerar Etiquetas</button>
                </div>
            </form>
        </Modal>
    );
};


export default RecebimentoPage;
