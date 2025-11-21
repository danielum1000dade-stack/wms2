
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { PrinterIcon } from '@heroicons/react/24/outline';
import RomaneioDescarga from '../components/RomaneioDescarga';
import { Recebimento } from '../types';

const RelatoriosPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('entradas');

    const TabButton: React.FC<{ tabName: string; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex space-x-2 border-b border-gray-200 mb-4 pb-2">
                    <TabButton tabName="entradas" label="Relatório de Entradas" />
                    <TabButton tabName="romaneio" label="Romaneio de Descarga" />
                </div>
                <div>
                    {activeTab === 'entradas' && <RelatorioEntradas />}
                    {activeTab === 'romaneio' && <RelatorioRomaneio />}
                </div>
            </div>
        </div>
    )
};


const RelatorioEntradas: React.FC = () => {
    const { recebimentos, industrias } = useWMS();
    
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        industria: 'todos',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredRecebimentos = useMemo(() => {
        return recebimentos.filter(r => {
            const dataRecebimento = new Date(r.dataHoraChegada);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            
            if (startDate && dataRecebimento < startDate) return false;
            if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
                if (dataRecebimento > adjustedEndDate) return false;
            }
            if (filters.industria !== 'todos' && r.fornecedor !== filters.industria) return false;

            return true;
        }).sort((a, b) => new Date(b.dataHoraChegada).getTime() - new Date(a.dataHoraChegada).getTime());
    }, [recebimentos, filters]);

    const handlePrint = () => {
        window.print();
    }
    return (
        <div className="space-y-6" id="relatorio-entradas">
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-section-entradas, #print-section-entradas * {
                        visibility: visible;
                    }
                    #print-section-entradas {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>

            <div className="no-print flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-800">Filtros do Relatório de Entradas</h2>
                 <button 
                    onClick={handlePrint}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <PrinterIcon className="h-5 w-5 mr-2" /> Imprimir Relatório
                </button>
            </div>
            
            <div className="no-print bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 md:space-y-0 md:flex md:space-x-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                </div>
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700">Indústria</label>
                     <select name="industria" value={filters.industria} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                        <option value="todos">Todas as Indústrias</option>
                        {industrias.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}
                    </select>
                </div>
            </div>

            <div id="print-section-entradas">
                 <div className="bg-white rounded-lg shadow-md mt-6">
                    <h2 className="text-xl font-bold p-4 block print:block hidden">Relatório de Entradas</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Fiscal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indústria</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp. (°C)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Pallets</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecebimentos.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.dataHoraChegada).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.notaFiscal}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.fornecedor}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.placaVeiculo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.temperaturaVeiculo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.etiquetasGeradas}</td>
                                    </tr>
                                ))}
                                {filteredRecebimentos.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">Nenhum recebimento encontrado com os filtros selecionados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


const RelatorioRomaneio: React.FC = () => {
    const { recebimentos } = useWMS();
    const [selectedRecebimentoId, setSelectedRecebimentoId] = useState<string>('');

    const selectedRecebimento = useMemo(() => {
        return recebimentos.find(r => r.id === selectedRecebimentoId) || null;
    }, [selectedRecebimentoId, recebimentos]);

    if (selectedRecebimento) {
        return <RomaneioDescarga recebimento={selectedRecebimento} onBack={() => setSelectedRecebimentoId('')} />;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Gerar Romaneio de Descarga</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="recebimento-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione um Recebimento para gerar o relatório:
                </label>
                <select
                    id="recebimento-select"
                    value={selectedRecebimentoId}
                    onChange={(e) => setSelectedRecebimentoId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="" disabled>-- Escolha um recebimento --</option>
                    {recebimentos
                        .sort((a, b) => new Date(b.dataHoraChegada).getTime() - new Date(a.dataHoraChegada).getTime())
                        .map(r => (
                            <option key={r.id} value={r.id}>
                                NF: {r.notaFiscal} - Placa: {r.placaVeiculo} ({new Date(r.dataHoraChegada).toLocaleDateString()})
                            </option>
                    ))}
                </select>
            </div>
            {recebimentos.length === 0 && (
                <p className="text-center text-gray-500 mt-4">Nenhum recebimento cadastrado ainda.</p>
            )}
        </div>
    );
};


export default RelatoriosPage;