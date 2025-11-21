import React, { useState, useMemo, useEffect } from 'react';
import { useWMS } from '../context/WMSContext';
import { Endereco, EnderecoTipo, InventoryCountSession, Etiqueta, EtiquetaStatus, InventoryCountItem, SKU, EnderecoStatus } from '../types';
import { PlusIcon, PlayIcon, DocumentMagnifyingGlassIcon, ListBulletIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const EstoquePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'consulta' | 'sessoes'>('consulta');

    const TabButton: React.FC<{ tabName: 'consulta' | 'sessoes'; label: string; icon: React.ElementType }> = ({ tabName, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            <Icon className="h-5 w-5 mr-2" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Inventário e Consulta de Estoque</h1>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex space-x-2 border-b border-gray-200 mb-4 pb-2 overflow-x-auto">
                    <TabButton tabName="consulta" label="Consulta de Posição" icon={MagnifyingGlassIcon} />
                    <TabButton tabName="sessoes" label="Contagem por Sessão" icon={ListBulletIcon} />
                </div>
                <div>
                    {activeTab === 'consulta' && <ConsultaPosicao />}
                    {activeTab === 'sessoes' && <GerenciadorSessoes />}
                </div>
            </div>
        </div>
    );
};

const ConsultaPosicao: React.FC = () => {
    const { enderecos, etiquetas, skus } = useWMS();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState<{ endereco: Endereco; etiqueta: Etiqueta | null; sku: SKU | null; } | null>(null);
    const [error, setError] = useState('');

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        
        setError('');
        setSearchResult(null);

        const endereco = enderecos.find(e => e.codigo.toLowerCase() === searchTerm.toLowerCase());

        if (endereco) {
            const etiqueta = etiquetas.find(et => et.enderecoId === endereco.id) || null;
            const sku = etiqueta ? skus.find(s => s.id === etiqueta.skuId) : null;
            setSearchResult({ endereco, etiqueta, sku });
        } else {
            setError(`Endereço "${searchTerm}" não encontrado.`);
        }
    };

    return (
        <div className="space-y-4">
             <h2 className="text-xl font-semibold">Consultar Posição no Armazém</h2>
             <div className="flex gap-2">
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Digite ou escaneie o código do endereço (ex: A01-01-01)"
                    className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                />
                <button onClick={handleSearch} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center">
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Buscar
                </button>
             </div>

             {error && <p className="text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
             {searchResult && (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div>
                             <h3 className="text-2xl font-bold text-gray-800">{searchResult.endereco.nome}</h3>
                             <p className="text-gray-500">{searchResult.endereco.tipo}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${searchResult.endereco.status === 'Livre' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {searchResult.endereco.status}
                        </span>
                    </div>
                     <hr className="my-4" />
                     <h4 className="font-semibold text-gray-700">Conteúdo Esperado pelo Sistema</h4>
                     {searchResult.etiqueta ? (
                        <div className="mt-2 space-y-2">
                            <p><strong>Pallet:</strong> <span className="font-mono text-indigo-600">{searchResult.etiqueta.id}</span></p>
                            <p><strong>SKU:</strong> {searchResult.sku?.sku} - {searchResult.sku?.descritivo}</p>
                            <p><strong>Quantidade:</strong> {searchResult.etiqueta.quantidadeCaixas} caixas</p>
                            <p><strong>Lote:</strong> {searchResult.etiqueta.lote}</p>
                            <p><strong>Validade:</strong> {searchResult.etiqueta.validade ? new Date(searchResult.etiqueta.validade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        </div>
                     ) : (
                        <p className="mt-2 text-gray-600 bg-gray-50 p-3 rounded-md">Sistema espera que esta posição esteja vazia.</p>
                     )}
                </div>
             )}
        </div>
    );
};


const GerenciadorSessoes: React.FC = () => {
    const { inventoryCountSessions } = useWMS();
    const [view, setView] = useState<'list' | 'counting'>('list');
    const [activeSession, setActiveSession] = useState<InventoryCountSession | null>(null);

    const handleStartNewCount = (session: InventoryCountSession) => {
        setActiveSession(session);
        setView('counting');
    };

    const handleViewSummary = (session: InventoryCountSession) => {
        setActiveSession(session);
        setView('counting'); // The CountingComponent handles summary view as well
    };

    const handleBackToList = () => {
        setActiveSession(null);
        setView('list');
    };
    
    if (view === 'counting' && activeSession) {
        return <CountingComponent session={activeSession} onBack={handleBackToList} />
    }

    return <SessionListComponent sessions={inventoryCountSessions} onStartNew={handleStartNewCount} onViewSummary={handleViewSummary} />;
}


const SessionListComponent: React.FC<{ sessions: InventoryCountSession[], onStartNew: (session: InventoryCountSession) => void, onViewSummary: (session: InventoryCountSession) => void }> = ({ sessions, onStartNew, onViewSummary }) => {
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sessões de Contagem</h2>
                <button onClick={() => setIsSetupModalOpen(true)} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                    <PlusIcon className="h-5 w-5 mr-2" /> Nova Contagem
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filtros</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progresso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{s.filters.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Object.entries(s.filters).filter(([key, val]) => key !== 'area' && val).map(([key, val]) => `${key}: ${val}`).join(', ') || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{s.locationsCounted} / {s.totalLocations}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.status === 'Concluído' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {s.status === 'Em Andamento' ? (
                                        <button onClick={() => onStartNew(s)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1">
                                            <PlayIcon className="h-4 w-4" /> Continuar
                                        </button>
                                    ) : (
                                         <button onClick={() => onViewSummary(s)} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                            <DocumentMagnifyingGlassIcon className="h-4 w-4" /> Ver Resumo
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isSetupModalOpen && <SetupCountModal onStart={onStartNew} onClose={() => setIsSetupModalOpen(false)} />}
        </div>
    );
};

const SetupCountModal: React.FC<{ onStart: (session: InventoryCountSession) => void; onClose: () => void }> = ({ onStart, onClose }) => {
    const { enderecos, startInventoryCount } = useWMS();
    const [filters, setFilters] = useState<InventoryCountSession['filters']>({
        area: EnderecoTipo.ARMAZENAGEM,
        corredor: 'todos',
        predio: 'todos',
        nivel: 'todos',
    });

    const addressParts = useMemo(() => {
        const parts = { corredores: new Set<string>(), predios: new Set<string>(), niveis: new Set<string>() };
        enderecos.forEach(e => {
            const codeParts = e.codigo.split('-');
            if (codeParts.length === 3) {
                const [corredor, predio, nivel] = codeParts.map(p => p.trim());
                 if (corredor && predio && nivel) {
                    parts.corredores.add(corredor);
                    parts.predios.add(predio);
                    parts.niveis.add(nivel);
                }
            }
        });
        return {
            corredores: Array.from(parts.corredores).sort(),
            predios: Array.from(parts.predios).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})),
            niveis: Array.from(parts.niveis).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})),
        };
    }, [enderecos]);

    const filteredLocations = useMemo(() => {
        return enderecos.filter(e => {
            if (e.tipo !== filters.area) return false;
            
            const codeParts = e.codigo.split('-').map(p => p.trim());
            
            if (codeParts.length === 3) {
                const [corredor, predio, nivel] = codeParts;
                if (filters.corredor !== 'todos' && corredor !== filters.corredor) return false;
                if (filters.predio !== 'todos' && predio !== filters.predio) return false;
                if (filters.nivel !== 'todos' && nivel !== filters.nivel) return false;
            } else {
                 // If address code doesn't fit the 3-part pattern, it can only be included if no specific filters are set.
                if (filters.corredor !== 'todos' || filters.predio !== 'todos' || filters.nivel !== 'todos') {
                    return false;
                }
            }
            
            return true;
        });
    }, [enderecos, filters]);

    const handleStart = () => {
        if (filteredLocations.length === 0) {
            alert('Nenhum endereço encontrado para os filtros selecionados. A contagem não pode ser iniciada.');
            return;
        }
        const session = startInventoryCount(
            {
                ...filters,
                corredor: filters.corredor === 'todos' ? undefined : filters.corredor,
                predio: filters.predio === 'todos' ? undefined : filters.predio,
                nivel: filters.nivel === 'todos' ? undefined : filters.nivel,
            },
            filteredLocations
        );
        onStart(session);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Configurar Nova Contagem</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Área do Armazém</label>
                        <select value={filters.area} onChange={e => setFilters(f => ({...f, area: e.target.value as EnderecoTipo, corredor: 'todos', predio: 'todos', nivel: 'todos'}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                            <option value={EnderecoTipo.ARMAZENAGEM}>Armazenagem</option>
                            <option value={EnderecoTipo.PICKING}>Picking</option>
                            <option value={EnderecoTipo.ANTECAMARA}>Antecâmara (Stage)</option>
                        </select>
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Corredor</label>
                            <select value={filters.corredor} onChange={e => setFilters(f => ({...f, corredor: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                <option value="todos">Todos</option>
                                {addressParts.corredores.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Prédio/Módulo</label>
                            <select value={filters.predio} onChange={e => setFilters(f => ({...f, predio: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                <option value="todos">Todos</option>
                                {addressParts.predios.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Nível</label>
                            <select value={filters.nivel} onChange={e => setFilters(f => ({...f, nivel: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                <option value="todos">Todos</option>
                                {addressParts.niveis.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                         </div>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md text-center">
                        <p className="font-semibold text-indigo-800">{filteredLocations.length} endereços serão contados.</p>
                    </div>
                </div>
                 <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleStart} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Iniciar Contagem</button>
                </div>
            </div>
        </div>
    );
};

const CountingComponent: React.FC<{ session: InventoryCountSession, onBack: () => void }> = ({ session, onBack }) => {
    const { enderecos, etiquetas, skus, recordCountItem, getCountItemsBySession, finishInventoryCount, undoLastCount, addEtiqueta, updateEtiqueta, updateEndereco } = useWMS();
    
    const countItems = useMemo(() => getCountItemsBySession(session.id), [session.id, getCountItemsBySession]);

    const locationsToCount = useMemo(() => {
        return enderecos.filter(e => {
            if (e.tipo !== session.filters.area) return false;
            
            const codeParts = e.codigo.split('-').map(p => p.trim());
            
            if (codeParts.length === 3) {
                const [corredor, predio, nivel] = codeParts;
                if (session.filters.corredor && corredor !== session.filters.corredor) return false;
                if (session.filters.predio && predio !== session.filters.predio) return false;
                if (session.filters.nivel && nivel !== session.filters.nivel) return false;
            } else {
                 if (session.filters.corredor || session.filters.predio || session.filters.nivel) {
                    return false;
                }
            }
            
            return true;
        }).sort((a,b) => a.codigo.localeCompare(b.codigo));
    }, [enderecos, session.filters]);

    const countedLocationIds = useMemo(() => new Set(countItems.map(item => item.enderecoId)), [countItems]);
    
    const currentPendingLocation = useMemo(() => {
        return locationsToCount.find(loc => !countedLocationIds.has(loc.id));
    }, [locationsToCount, countedLocationIds]);
    
    const [foundEtiquetaId, setFoundEtiquetaId] = useState('');
    const [countedQuantity, setCountedQuantity] = useState<number | ''>('');
    const [justification, setJustification] = useState('');
    const [feedback, setFeedback] = useState('');
    const [countedSkuInput, setCountedSkuInput] = useState('');
    const [foundCountedSku, setFoundCountedSku] = useState<SKU | null>(null);
    const [countedSkuError, setCountedSkuError] = useState('');
    const [countedLote, setCountedLote] = useState('');
    const [countedValidade, setCountedValidade] = useState('');

    const expectedEtiqueta = useMemo(() => {
        if (!currentPendingLocation) return null;
        return etiquetas.find(et => et.enderecoId === currentPendingLocation.id) || null;
    }, [currentPendingLocation, etiquetas]);

    const resetCountForm = () => {
        setFoundEtiquetaId('');
        setCountedQuantity('');
        setJustification('');
        setCountedSkuInput('');
        setFoundCountedSku(null);
        setCountedSkuError('');
        setCountedLote('');
        setCountedValidade('');
        setFeedback('');
    };

    useEffect(() => {
        if (currentPendingLocation) {
            if (expectedEtiqueta) {
                const sku = skus.find(s => s.id === expectedEtiqueta.skuId);
                setFoundEtiquetaId(expectedEtiqueta.id);
                setCountedQuantity(expectedEtiqueta.quantidadeCaixas ?? '');
                setCountedLote(expectedEtiqueta.lote ?? '');
                const formattedDate = expectedEtiqueta.validade ? new Date(expectedEtiqueta.validade).toISOString().split('T')[0] : '';
                setCountedValidade(formattedDate);
                if (sku) {
                    setCountedSkuInput(sku.sku);
                    setFoundCountedSku(sku);
                    setCountedSkuError('');
                } else {
                    setCountedSkuInput('');
                    setFoundCountedSku(null);
                }
            } else {
                resetCountForm();
            }
        }
    }, [currentPendingLocation, expectedEtiqueta, skus]);

    const handleSkuInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCountedSkuInput(value);
        setFoundCountedSku(null);
        setCountedSkuError('');
    };

    const handleSkuBlur = () => {
        if (!countedSkuInput.trim()) {
            if (Number(countedQuantity) > 0 || foundEtiquetaId) {
                setCountedSkuError('SKU é obrigatório se houver quantidade ou etiqueta.');
            }
            return;
        }
        const sku = skus.find(s => s.sku.toLowerCase() === countedSkuInput.toLowerCase());
        if (sku) {
            setFoundCountedSku(sku);
            setCountedSkuError('');
        } else {
            setFoundCountedSku(null);
            setCountedSkuError('SKU não encontrado no cadastro.');
        }
    };

    const progress = (countedLocationIds.size / locationsToCount.length) * 100;

    const handleSubmitCount = (status: 'Contado' | 'Vazio' | 'Pulado') => {
        if (!currentPendingLocation) return;
        setFeedback('');

        let itemData: Omit<InventoryCountItem, 'id'> = {
            sessionId: session.id,
            enderecoId: currentPendingLocation.id,
            expectedEtiquetaId: expectedEtiqueta?.id || null,
            expectedSkuId: expectedEtiqueta?.skuId || null,
            expectedQuantity: expectedEtiqueta?.quantidadeCaixas || null,
            foundEtiquetaId: null,
            countedSkuId: null,
            countedLote: null,
            countedValidade: null,
            countedQuantity: null,
            discrepancy: 0,
            countedAt: new Date().toISOString(),
            status,
            justification: '',
        };

        if (status === 'Contado') {
            if (countedQuantity === '' || Number(countedQuantity) < 0) {
                setFeedback('Preencha a quantidade contada com um valor válido.');
                return;
            }
            if (Number(countedQuantity) > 0 && !foundCountedSku) {
                handleSkuBlur();
                setFeedback('SKU contado é inválido ou não foi encontrado.');
                return;
            }

            const countedQty = Number(countedQuantity);
            let finalFoundEtiquetaId: string | null = null;

            // Case A: Product found in an address expected to be empty. Create a new pallet.
            if (!expectedEtiqueta && countedQty > 0 && foundCountedSku) {
                const newEtiqueta = addEtiqueta({
                    skuId: foundCountedSku.id,
                    quantidadeCaixas: countedQty,
                    lote: countedLote,
                    validade: countedValidade,
                    enderecoId: currentPendingLocation.id,
                    status: EtiquetaStatus.ARMAZENADA,
                    dataApontamento: new Date().toISOString(),
                    dataArmazenagem: new Date().toISOString(),
                });
                finalFoundEtiquetaId = newEtiqueta.id;
            }
            // Case B: Product found where one was expected. Update the existing pallet's data.
            else if (expectedEtiqueta) {
                const updatedEtiqueta: Etiqueta = {
                    ...expectedEtiqueta,
                    skuId: foundCountedSku?.id || expectedEtiqueta.skuId,
                    quantidadeCaixas: countedQty,
                    lote: countedLote,
                    validade: countedValidade,
                };
                updateEtiqueta(updatedEtiqueta);
                finalFoundEtiquetaId = expectedEtiqueta.id;
            }

            itemData.foundEtiquetaId = finalFoundEtiquetaId;
            itemData.countedQuantity = countedQty;
            itemData.countedSkuId = foundCountedSku?.id || null;
            itemData.countedLote = countedLote || null;
            itemData.countedValidade = countedValidade || null;
            itemData.discrepancy = (itemData.countedQuantity || 0) - (itemData.expectedQuantity || 0);

        } else if (status === 'Vazio') {
             itemData.countedQuantity = 0;
             itemData.discrepancy = 0 - (itemData.expectedQuantity || 0);
             // If a pallet was expected but the location is empty, update the pallet and location
             if (expectedEtiqueta) {
                 updateEtiqueta({ ...expectedEtiqueta, enderecoId: undefined, status: EtiquetaStatus.APONTADA });
                 updateEndereco({ ...currentPendingLocation, status: EnderecoStatus.LIVRE });
             }
        }

        recordCountItem(itemData);
        resetCountForm();
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        } catch {
            return 'Data Inválida';
        }
    }

    if (session.status === 'Concluído' || !currentPendingLocation) {
        // Summary View
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">Resumo do Inventário</h2>
                <p className="text-sm text-gray-500 mb-4">Sessão: {new Date(session.createdAt).toLocaleString()}</p>
                 <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Endereço</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Esperado</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contado</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Divergência</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                             {countItems.map(item => {
                                const endereco = enderecos.find(e => e.id === item.enderecoId);
                                const expectedEtiqueta = etiquetas.find(et => et.id === item.expectedEtiquetaId);
                                const expectedSku = skus.find(s => s.id === item.expectedSkuId);
                                const countedSku = skus.find(s => s.id === item.countedSkuId);
                                const hasDiscrepancy = item.status === 'Contado' ? (
                                    item.discrepancy !== 0 ||
                                    item.expectedSkuId !== item.countedSkuId ||
                                    (expectedEtiqueta?.lote ?? null) !== item.countedLote ||
                                    (expectedEtiqueta?.validade ? new Date(expectedEtiqueta.validade).toISOString().split('T')[0] : null) !== item.countedValidade
                                ) : item.discrepancy !== 0;

                                return (
                                    <tr key={item.id} className={hasDiscrepancy ? 'bg-red-50' : ''}>
                                        <td className="px-4 py-2 whitespace-nowrap font-semibold">{endereco?.nome}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.expectedEtiquetaId 
                                                ? `(${expectedSku?.sku}) ${item.expectedQuantity} cx, L: ${expectedEtiqueta?.lote}, V: ${formatDate(expectedEtiqueta?.validade)}` 
                                                : 'Vazio'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.status === 'Contado' 
                                                ? `(${countedSku?.sku || 'N/A'}) ${item.countedQuantity} cx, L: ${item.countedLote}, V: ${formatDate(item.countedValidade)}` 
                                                : item.status}
                                        </td>
                                        <td className={`px-4 py-2 whitespace-nowrap font-bold text-sm ${hasDiscrepancy ? 'text-red-600' : 'text-green-600'}`}>
                                            <div className="flex flex-col">
                                                {item.discrepancy !== 0 && <span>Qtd: {item.discrepancy > 0 ? `+${item.discrepancy}`: item.discrepancy}</span>}
                                                {item.status === 'Contado' && item.expectedSkuId !== item.countedSkuId && <span className="text-xs">SKU Divergente</span>}
                                                {item.status === 'Contado' && expectedEtiqueta?.lote !== item.countedLote && <span className="text-xs">Lote Divergente</span>}
                                                {item.status === 'Contado' && (expectedEtiqueta?.validade ? new Date(expectedEtiqueta.validade).toISOString().split('T')[0] : null) !== item.countedValidade && <span className="text-xs">Validade Divergente</span>}
                                                {!hasDiscrepancy && <span>OK</span>}
                                            </div>
                                        </td>
                                    </tr>
                                )
                             })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                     <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Voltar à Lista</button>
                </div>
            </div>
        )
    }

    // Counting View
    return (
        <div>
            <div className="mb-4">
                 <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Progresso da Contagem</span>
                    <span>{countedLocationIds.size + 1} / {locationsToCount.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Info Panel */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg text-gray-600">Posição a ser contada:</h3>
                    <p className="text-4xl font-bold text-indigo-600 my-2 break-words">{currentPendingLocation.nome}</p>
                    
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="font-bold text-lg text-gray-800">O que o sistema espera aqui?</h4>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mt-2">
                        {expectedEtiqueta ? (
                             <div className="space-y-1">
                                <p><strong>Pallet:</strong> <span className="font-mono text-blue-800">{expectedEtiqueta.id}</span></p>
                                <p><strong>SKU:</strong> <span className="font-semibold text-blue-800">{skus.find(s=>s.id === expectedEtiqueta.skuId)?.sku}</span></p>
                                <p><strong>Produto:</strong> <span className="font-semibold text-blue-800">{skus.find(s=>s.id === expectedEtiqueta.skuId)?.descritivo}</span></p>
                                <p><strong>Qtd:</strong> <span className="font-semibold text-blue-800">{expectedEtiqueta.quantidadeCaixas} caixas</span></p>
                                <p><strong>Lote:</strong> <span className="font-semibold text-blue-800">{expectedEtiqueta.lote || 'N/A'}</span></p>
                                <p><strong>Validade:</strong> <span className="font-semibold text-blue-800">{expectedEtiqueta.validade ? new Date(expectedEtiqueta.validade).toLocaleDateString('pt-BR') : 'N/A'}</span></p>
                            </div>
                        ) : <p className="text-gray-700 font-semibold">Endereço Vazio</p>}
                        </div>
                    </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-4">
                     <h3 className="font-semibold text-lg">Sua Contagem:</h3>
                     {feedback && <p className="text-red-500 text-sm">{feedback}</p>}
                    <div className="p-4 border rounded-md space-y-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-700">Informações do Pallet Contado</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ID da Etiqueta Lida (Opcional)</label>
                                <input type="text" value={foundEtiquetaId} onChange={e => setFoundEtiquetaId(e.target.value.toUpperCase())} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU Contado</label>
                                <input
                                    type="text"
                                    value={countedSkuInput}
                                    onChange={handleSkuInputChange}
                                    onBlur={handleSkuBlur}
                                    placeholder="Código do SKU"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                                />
                                {foundCountedSku && ( <p className="text-xs text-green-700 mt-1 truncate" title={foundCountedSku.descritivo}>✓ {foundCountedSku.descritivo}</p> )}
                                {countedSkuError && ( <p className="text-xs text-red-700 mt-1">{countedSkuError}</p> )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Lote Contado</label>
                                <input type="text" value={countedLote} onChange={e => setCountedLote(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Validade Contada</label>
                                <input type="date" value={countedValidade} onChange={e => setCountedValidade(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 font-bold">Quantidade Contada</label>
                                <input type="number" value={countedQuantity} onChange={e => setCountedQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleSubmitCount('Contado')} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow hover:bg-green-700">Confirmar Contagem</button>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleSubmitCount('Vazio')} className="w-full bg-yellow-500 text-white py-2 rounded-lg shadow hover:bg-yellow-600">Endereço Vazio</button>
                        <button onClick={() => handleSubmitCount('Pulado')} className="w-full bg-gray-400 text-white py-2 rounded-lg shadow hover:bg-gray-500">Pular Endereço</button>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <div className="flex gap-2">
                    <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Sair da Contagem</button>
                    <button onClick={() => undoLastCount(session.id)} disabled={countItems.length === 0} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowUturnLeftIcon className="h-5 w-5" />
                        Voltar Posição Anterior
                    </button>
                </div>
                <button onClick={() => finishInventoryCount(session.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Finalizar e Ver Resumo</button>
            </div>
        </div>
    )
};


export default EstoquePage;