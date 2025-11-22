
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { ArchiveBoxIcon, PrinterIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import RomaneioDescarga from '../components/RomaneioDescarga';
import { Recebimento, EtiquetaStatus } from '../types';

declare const XLSX: any;

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
                    <TabButton tabName="inventario" label="Inventário Consolidado" />
                    <TabButton tabName="posicao" label="Posição de Estoque" />
                </div>
                <div>
                    {activeTab === 'entradas' && <RelatorioEntradas />}
                    {activeTab === 'romaneio' && <RelatorioRomaneio />}
                    {activeTab === 'inventario' && <RelatorioInventarioConsolidado />}
                    {activeTab === 'posicao' && <RelatorioPosicaoEstoque />}
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

const RelatorioInventarioConsolidado: React.FC = () => {
    const { industrias, skus, etiquetas, enderecos } = useWMS();
    const [selectedIndustria, setSelectedIndustria] = useState('todos');

    const reportData = useMemo(() => {
        const storedEtiquetas = etiquetas.filter(e => e.status === EtiquetaStatus.ARMAZENADA && e.skuId && e.enderecoId);

        const filteredByIndustria = storedEtiquetas.filter(et => {
            if (selectedIndustria === 'todos') return true;
            const sku = skus.find(s => s.id === et.skuId);
            return sku?.industriaId === selectedIndustria;
        });

        type ConsolidatedSkuData = {
            sku: string;
            descritivo: string;
            totalCaixas: number;
            pallets: { id: string; location: string; }[];
        };
        
        type ConsolidatedIndustriaData = {
            industriaName: string;
            skus: Record<string, ConsolidatedSkuData>;
        };
        
        const consolidated = filteredByIndustria.reduce((acc, et) => {
            const sku = skus.find(s => s.id === et.skuId);
            if (!sku) return acc;
            
            const industriaId = sku.industriaId || 'sem_industria';
            const industria = industrias.find(i => i.id === industriaId);
            const industriaName = industria?.nome || 'Produtos sem Indústria';

            if (!acc[industriaId]) {
                acc[industriaId] = { industriaName, skus: {} };
            }
            if (!acc[industriaId].skus[sku.id]) {
                acc[industriaId].skus[sku.id] = {
                    sku: sku.sku,
                    descritivo: sku.descritivo,
                    totalCaixas: 0,
                    pallets: [],
                };
            }

            const endereco = enderecos.find(e => e.id === et.enderecoId);
            acc[industriaId].skus[sku.id].totalCaixas += et.quantidadeCaixas || 0;
            acc[industriaId].skus[sku.id].pallets.push({
                id: et.id,
                location: endereco?.nome || 'N/A'
            });

            return acc;
// FIX: Use a type assertion on the initial value of `reduce` to ensure the accumulator `acc` is correctly typed. This resolves cascading 'unknown' type errors in the subsequent `.map()` call.
        }, {} as Record<string, ConsolidatedIndustriaData>);

        return Object.values(consolidated).map(industriaData => {
            const skusList = Object.values(industriaData.skus);
            return ({
                ...industriaData,
                skus: skusList.sort((a,b) => a.sku.localeCompare(b.sku)),
                totalCaixas: skusList.reduce((sum, sku) => sum + sku.totalCaixas, 0),
                totalPallets: skusList.reduce((sum, sku) => sum + sku.pallets.length, 0),
            })
        }).sort((a,b) => a.industriaName.localeCompare(b.industriaName));

    }, [selectedIndustria, etiquetas, skus, industrias, enderecos]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-inventario, #print-section-inventario * { visibility: visible; }
                    #print-section-inventario { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                }
            `}</style>
             <div className="no-print flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-800">Relatório de Inventário Consolidado</h2>
                 <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700">
                    <PrinterIcon className="h-5 w-5 mr-2" /> Imprimir
                </button>
            </div>
            <div className="no-print bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700">Filtrar por Indústria</label>
                <select value={selectedIndustria} onChange={e => setSelectedIndustria(e.target.value)} className="mt-1 block w-full md:w-1/3 rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                    <option value="todos">Todas as Indústrias</option>
                    {industrias.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
            </div>

            <div id="print-section-inventario">
                {reportData.length > 0 ? reportData.map(industria => (
                    <div key={industria.industriaName} className="bg-white rounded-lg shadow-md mt-6 mb-8 p-4">
                        <div className="border-b pb-2 mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">{industria.industriaName}</h3>
                            <p className="text-sm text-gray-500">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descritivo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd. Caixas</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd. Pallets</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posições</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {industria.skus.map(sku => (
                                        <tr key={sku.sku}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{sku.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{sku.descritivo}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{sku.totalCaixas}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{sku.pallets.length}</td>
                                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{sku.pallets.map(p => p.location).join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100">
                                    <tr>
                                        <td colSpan={2} className="px-6 py-3 text-right font-bold">TOTAIS DA INDÚSTRIA:</td>
                                        <td className="px-6 py-3 font-bold">{industria.totalCaixas}</td>
                                        <td className="px-6 py-3 font-bold">{industria.totalPallets}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 text-gray-500">
                        <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item em estoque encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">Não há pallets armazenados que correspondam ao filtro selecionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RelatorioPosicaoEstoque: React.FC = () => {
    const { etiquetas, enderecos, skus, industrias } = useWMS();

    const [filters, setFilters] = useState({
        sku: '',
        lote: '',
        endereco: '',
        industriaId: 'todos',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const stockData = useMemo(() => {
        return etiquetas
            .filter(etiqueta => {
                if (etiqueta.status !== EtiquetaStatus.ARMAZENADA || !etiqueta.enderecoId) return false;
                
                const sku = skus.find(s => s.id === etiqueta.skuId);
                const endereco = enderecos.find(e => e.id === etiqueta.enderecoId);

                if (filters.sku && (!sku || !sku.sku.toLowerCase().includes(filters.sku.toLowerCase()))) return false;
                if (filters.lote && (!etiqueta.lote || !etiqueta.lote.toLowerCase().includes(filters.lote.toLowerCase()))) return false;
                if (filters.endereco && (!endereco || !endereco.nome.toLowerCase().includes(filters.endereco.toLowerCase()))) return false;
                if (filters.industriaId !== 'todos' && (!sku || sku.industriaId !== filters.industriaId)) return false;
                
                return true;
            })
            .map(etiqueta => {
                const endereco = enderecos.find(e => e.id === etiqueta.enderecoId);
                const sku = skus.find(s => s.id === etiqueta.skuId);
                const industria = sku ? industrias.find(i => i.id === sku.industriaId) : null;

                return {
                    id: etiqueta.id,
                    endereco: endereco?.nome || 'N/A',
                    palletId: etiqueta.id,
                    sku: sku?.sku || 'N/A',
                    descricao: sku?.descritivo || 'N/A',
                    lote: etiqueta.lote || 'N/A',
                    validade: etiqueta.validade ? new Date(etiqueta.validade).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A',
                    quantidade: etiqueta.quantidadeCaixas || 0,
                    industria: industria?.nome || 'N/A'
                };
            })
            .sort((a, b) => a.endereco.localeCompare(b.endereco));
    }, [etiquetas, enderecos, skus, industrias, filters]);

    const handleExportExcel = () => {
        const headers = ['Endereço', 'ID Pallet', 'SKU', 'Descrição', 'Lote', 'Validade', 'Qtd. Caixas', 'Indústria'];
        
        const dataToExport = stockData.map(item => [
            item.endereco,
            item.palletId,
            item.sku,
            item.descricao,
            item.lote,
            item.validade,
            item.quantidade,
            item.industria
        ]);

        const ws_data = [headers, ...dataToExport];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        
        ws['!cols'] = [
            { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 40 },
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 25 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Posicao_Estoque");
        XLSX.writeFile(wb, "relatorio_posicao_estoque.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Relatório de Posição de Estoque</h2>
                <button 
                    onClick={handleExportExcel}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"
                >
                    <TableCellsIcon className="h-5 w-5 mr-2" /> Exportar para Excel
                </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                    <input type="text" name="endereco" value={filters.endereco} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input type="text" name="sku" value={filters.sku} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Lote</label>
                    <input type="text" name="lote" value={filters.lote} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Indústria</label>
                     <select name="industriaId" value={filters.industriaId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                        <option value="todos">Todas</option>
                        {industrias.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endereço</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pallet</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Caixas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stockData.map(item => (
                            <tr key={item.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.endereco}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.palletId}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.descricao}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.lote}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.validade}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-semibold">{item.quantidade}</td>
                            </tr>
                        ))}
                         {stockData.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
                                    Nenhum item em estoque encontrado com os filtros selecionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default RelatoriosPage;
