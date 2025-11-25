
import React, { useState, useMemo, useEffect } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo, PrinterConfig, Etiqueta, Recebimento } from '../types';
import { 
    CubeIcon, ArrowRightIcon, CheckCircleIcon, ArrowUturnLeftIcon, FunnelIcon, 
    ExclamationTriangleIcon, CameraIcon, XMarkIcon, MapPinIcon, QrCodeIcon, 
    HandRaisedIcon, Squares2X2Icon, Bars3Icon, PrinterIcon, BoltIcon, 
    ArrowPathIcon, ClockIcon, PlayIcon, Cog6ToothIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';
import Modal from '../components/Modal';
import EtiquetasImprimir from '../components/EtiquetasImprimir';

// --- STYLES & HELPERS ---

const PRIORITY_COLORS = {
    URGENTE: 'bg-rose-50 border-rose-500 text-rose-700',
    ALTA: 'bg-orange-50 border-orange-500 text-orange-700',
    MEDIA: 'bg-blue-50 border-blue-500 text-blue-700',
    BAIXA: 'bg-slate-50 border-slate-300 text-slate-600'
};

const STATUS_COLORS = {
    'Pendente': 'bg-slate-200 text-slate-800',
    'Atribuída': 'bg-indigo-200 text-indigo-800',
    'Em Andamento': 'bg-amber-200 text-amber-900',
    'Concluída': 'bg-emerald-200 text-emerald-900'
};

const getTypeIcon = (type: MissaoTipo) => {
    switch(type) {
        case MissaoTipo.PICKING: return CubeIcon;
        case MissaoTipo.REABASTECIMENTO: return ArrowUturnLeftIcon;
        case MissaoTipo.ARMAZENAGEM: return ArrowRightIcon;
        default: return CheckCircleIcon;
    }
};

// --- COMPONENTS ---

// 1. PRINTER CONFIG MODAL
const PrinterConfigModal: React.FC<{ isOpen: boolean, onClose: () => void, onTestPrint: () => void }> = ({ isOpen, onClose, onTestPrint }) => {
    const { printerConfig, savePrinterConfig } = useWMS();
    const [config, setConfig] = useState<PrinterConfig>(printerConfig);

    const handleSave = () => {
        savePrinterConfig(config);
        onClose();
    };

    const handleTest = () => {
        if (config.type === 'PDF_FALLBACK') {
            onTestPrint(); // Triggers the visual print in parent
        } else {
            alert(`Enviando comando ZPL para impressora em ${config.ip}:${config.port}... (Simulado)`);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal title="Configuração de Impressora" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Modo de Impressão</label>
                    <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                        value={config.type}
                        onChange={e => setConfig({...config, type: e.target.value as any})}
                    >
                        <option value="PDF_FALLBACK">Visualizar PDF / Navegador (Padrão)</option>
                        <option value="ZEBRA_NETWORK">Zebra (Rede/IP) - Requer Bridge</option>
                        <option value="ZEBRA_USB">Zebra (USB) - Requer QZ Tray</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Use "Visualizar PDF" para usar o driver da impressora instalado no Windows/Mac.
                    </p>
                </div>

                {config.type === 'ZEBRA_NETWORK' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">IP da Impressora</label>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                                value={config.ip || ''}
                                onChange={e => setConfig({...config, ip: e.target.value})}
                                placeholder="192.168.1.200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Porta</label>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                                value={config.port || '9100'}
                                onChange={e => setConfig({...config, port: e.target.value})}
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Densidade (DPI)</label>
                    <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                        value={config.zplDensity}
                        onChange={e => setConfig({...config, zplDensity: Number(e.target.value)})}
                    >
                        <option value={8}>203 dpi (8 dots/mm)</option>
                        <option value={12}>300 dpi (12 dots/mm)</option>
                    </select>
                </div>

                <div className="pt-4 border-t flex justify-between">
                    <button 
                        onClick={handleTest}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-200 flex items-center"
                    >
                        <PrinterIcon className="h-5 w-5 mr-2"/> Testar Impressão
                    </button>
                    <div className="flex space-x-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancelar</button>
                        <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Salvar Config</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// 2. EXECUTION WIZARD (OPERATOR MODE)
interface WizardProps {
    missao: Missao;
    onClose: () => void;
    onComplete: () => void;
    onPrint: (etiqueta: Etiqueta) => void;
}

const ExecutionWizard: React.FC<WizardProps> = ({ missao, onClose, onComplete, onPrint }) => {
    const { skus, enderecos, updateMissionStatus, reportPickingShortage, etiquetas, printerConfig } = useWMS();
    const [step, setStep] = useState(0);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [shake, setShake] = useState(false);

    const sku = skus.find(s => s.id === missao.skuId);
    const origem = enderecos.find(e => e.id === missao.origemId);
    const destino = enderecos.find(e => e.id === missao.destinoId);
    const etiqueta = etiquetas.find(e => e.id === missao.etiquetaId);

    const steps = [
        {
            title: 'Origem',
            instruction: `Vá até ${origem?.codigo}`,
            target: origem?.codigo,
            validate: (val: string) => val.toUpperCase() === origem?.codigo.toUpperCase(),
            icon: MapPinIcon
        },
        {
            title: 'Produto',
            instruction: `Confirme SKU: ${sku?.sku}`,
            sub: `Qtd: ${missao.quantidade} ${sku?.unidadeMedida}`,
            target: sku?.sku,
            validate: (val: string) => val.toUpperCase() === sku?.sku.toUpperCase() || val.toUpperCase() === missao.etiquetaId,
            icon: CubeIcon
        },
        {
            title: 'Destino',
            instruction: `Leve para ${destino?.codigo || 'Expedição'}`,
            target: destino?.codigo || 'STAGE',
            validate: (val: string) => val.toUpperCase() === (destino?.codigo || 'STAGE').toUpperCase(),
            icon: ArrowRightIcon
        },
        {
            title: 'Finalizar',
            instruction: 'Confirme a conclusão',
            isAction: true,
            icon: CheckCircleIcon
        }
    ];

    const current = steps[step];

    const showError = (msg: string) => {
        setError(msg);
        setShake(true);
        if(navigator.vibrate) navigator.vibrate(300);
        setTimeout(() => setShake(false), 500);
    };

    const handleNext = () => {
        if (current.isAction) {
            updateMissionStatus(missao.id, 'Concluída');
            onComplete();
            return;
        }
        if (current.validate && current.validate(input)) {
            setError('');
            setInput('');
            setStep(p => p + 1);
        } else {
            showError('Código incorreto!');
        }
    };

    const handleScan = (code: string) => {
        setInput(code);
        setIsScanning(false);
        // Auto-submit logic could go here
    };

    const handlePrintLabel = () => {
        if(!etiqueta) return;
        
        if(printerConfig.type === 'PDF_FALLBACK') {
            onPrint(etiqueta);
        } else {
            // ZPL Logic via Network
            console.log("Printing ZPL to " + printerConfig.ip);
            alert("Enviado para impressora ZPL (Simulado)");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="bg-slate-800 p-4 flex justify-between items-center shadow-md">
                <button onClick={onClose} className="text-white bg-slate-700 p-2 rounded-full hover:bg-slate-600">
                    <XMarkIcon className="h-6 w-6"/>
                </button>
                <div className="text-center">
                    <h2 className="text-white font-bold text-lg uppercase">{current.title}</h2>
                    <div className="flex space-x-1 justify-center mt-1">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1 w-8 rounded ${i === step ? 'bg-indigo-500' : i < step ? 'bg-green-500' : 'bg-slate-600'}`} />
                        ))}
                    </div>
                </div>
                <button onClick={handlePrintLabel} className="text-white bg-slate-700 p-2 rounded-full hover:bg-slate-600" title="Reimprimir Etiqueta">
                    <PrinterIcon className="h-6 w-6"/>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-6 items-center justify-center space-y-8">
                <div className={`p-8 rounded-full bg-slate-800 border-4 ${error ? 'border-red-500' : 'border-indigo-500'} shadow-2xl ${shake ? 'animate-shake' : ''}`}>
                    <current.icon className={`h-24 w-24 ${error ? 'text-red-500' : 'text-indigo-400'}`} />
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-white break-words">{current.target || 'CONFIRMAR'}</h1>
                    <p className="text-xl text-slate-300 font-medium">{current.instruction}</p>
                    {current.sub && <div className="inline-block bg-yellow-600/20 text-yellow-400 px-4 py-1 rounded-full font-bold border border-yellow-600">{current.sub}</div>}
                </div>

                {/* Input/Scan Area */}
                {!current.isAction && (
                    <div className="w-full max-w-md space-y-4">
                        {isScanning ? (
                            <div className="h-64 bg-black rounded-xl overflow-hidden border-2 border-indigo-500 relative">
                                <BarcodeScanner onScanSuccess={handleScan} />
                                <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 bg-white/20 text-white p-1 rounded-full">
                                    <XMarkIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input 
                                    value={input}
                                    onChange={e => setInput(e.target.value.toUpperCase())}
                                    placeholder="Digitar código..."
                                    className="flex-1 bg-slate-800 border-2 border-slate-600 text-white rounded-xl px-4 py-4 text-xl font-mono focus:border-indigo-500 focus:outline-none"
                                    autoFocus
                                />
                                <button onClick={() => setIsScanning(true)} className="bg-slate-700 text-white px-6 rounded-xl hover:bg-slate-600">
                                    <CameraIcon className="h-8 w-8"/>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <button 
                    onClick={handleNext}
                    className={`w-full max-w-md py-5 rounded-xl text-xl font-black shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${current.isAction ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                    {current.isAction ? 'CONCLUIR TAREFA' : 'CONFIRMAR'}
                    {!current.isAction && <ArrowRightIcon className="h-6 w-6" />}
                </button>

                {/* Report Issue */}
                {!current.isAction && (
                    <button onClick={() => {
                        if(confirm("Reportar ruptura?")) {
                            reportPickingShortage(missao.id, 'operador');
                            onClose();
                        }
                    }} className="text-slate-400 text-sm font-semibold underline hover:text-white">
                        Reportar Problema / Ruptura
                    </button>
                )}
            </div>
        </div>
    );
};

// 3. MAIN PAGE
const MissoesPage: React.FC = () => {
    const { missoes, skus, enderecos, updateMissionStatus, recebimentos } = useWMS();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [filterType, setFilterType] = useState('TODOS');
    const [filterStatus, setFilterStatus] = useState('Pendente');
    const [activeMission, setActiveMission] = useState<Missao | null>(null);
    const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
    
    // State to control Print Overlay
    const [printData, setPrintData] = useState<{etiquetas: Etiqueta[], recebimento: Recebimento} | null>(null);

    // Derived Stats
    const stats = useMemo(() => ({
        total: missoes.length,
        pending: missoes.filter(m => m.status === 'Pendente').length,
        urgent: missoes.filter(m => (m.prioridadeScore||0) > 80).length,
        doneToday: missoes.filter(m => m.status === 'Concluída').length // Simplified
    }), [missoes]);

    // Filtered Data
    const filteredMissions = useMemo(() => {
        return missoes.filter(m => {
            if (filterType !== 'TODOS' && m.tipo !== filterType) return false;
            if (filterStatus !== 'TODOS' && m.status !== filterStatus) return false;
            return true;
        }).sort((a, b) => (b.prioridadeScore || 0) - (a.prioridadeScore || 0));
    }, [missoes, filterType, filterStatus]);

    const handleStart = (m: Missao) => {
        if (m.status === 'Pendente') {
            updateMissionStatus(m.id, 'Em Andamento', 'admin_user'); // Mock user
        }
        setActiveMission(m);
    };

    // Handle Print Request (Visual)
    const handlePrintRequest = (etiqueta?: Etiqueta) => {
        // If no etiqueta passed (e.g. Test Print), make a dummy
        let etToPrint = etiqueta;
        let recToPrint: Recebimento | undefined;

        if (!etToPrint) {
            etToPrint = {
                id: 'TEST-LABEL',
                recebimentoId: 'TEST',
                skuId: skus[0]?.id || 'TEST',
                quantidadeCaixas: 10,
                lote: 'TESTE123',
                status: 'Apontada'
            } as Etiqueta;
        }

        recToPrint = recebimentos.find(r => r.id === etToPrint!.recebimentoId);
        
        if (!recToPrint) {
            recToPrint = {
                id: 'TEST-REC',
                notaFiscal: 'TESTE',
                fornecedor: 'SISTEMA WMS',
                placaVeiculo: 'TEST-001',
                dataHoraChegada: new Date().toISOString(),
                etiquetasGeradas: 1,
                status: 'Finalizado',
                temperaturaVeiculo: 0
            } as Recebimento;
        }

        setPrintData({ etiquetas: [etToPrint], recebimento: recToPrint });
    };

    return (
        <div className="relative min-h-screen bg-slate-50">
            {/* PRINT LAYER - Overlays everything when active */}
            {printData && (
                <div className="absolute inset-0 z-[100] bg-white">
                    <EtiquetasImprimir 
                        recebimento={printData.recebimento} 
                        etiquetas={printData.etiquetas} 
                        onBack={() => setPrintData(null)} 
                    />
                </div>
            )}

            {/* MAIN CONTENT - Hidden when printing to preserve state/prevent interactions, but kept in DOM logic if needed (CSS hide) */}
            <div className={printData ? 'hidden' : ''}>
                {/* TOP BAR */}
                <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white">
                            <BoltIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-tight">Centro de Missões</h1>
                            <p className="text-xs text-slate-500">{stats.pending} Pendentes • {stats.urgent} Urgentes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsPrinterModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Configurar Impressora">
                            <PrinterIcon className="h-6 w-6" />
                        </button>
                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-slate-200 text-indigo-600' : 'text-slate-400'}`}>
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-200 text-indigo-600' : 'text-slate-400'}`}>
                            <Squares2X2Icon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4 max-w-7xl mx-auto space-y-6">
                    {/* FILTERS */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                            {['TODOS', MissaoTipo.PICKING, MissaoTipo.ARMAZENAGEM, MissaoTipo.REABASTECIMENTO].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                        filterType === type 
                                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300' 
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {type === 'TODOS' ? 'Todas' : type}
                                </button>
                            ))}
                        </div>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-white border-slate-300 rounded-lg text-sm py-2 px-4 shadow-sm w-full md:w-48"
                        >
                            <option value="TODOS">Todos os Status</option>
                            <option value="Pendente">Pendentes</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluída">Concluídas</option>
                        </select>
                    </div>

                    {/* CONTENT AREA */}
                    {filteredMissions.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-white inline-block p-6 rounded-full shadow-sm mb-4">
                                <CheckCircleIcon className="h-16 w-16 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">Tudo em dia!</h3>
                            <p className="text-slate-500">Não há missões para os filtros selecionados.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMissions.map(m => {
                                const sku = skus.find(s => s.id === m.skuId);
                                const origem = enderecos.find(e => e.id === m.origemId);
                                const isUrgent = (m.prioridadeScore||0) > 80;
                                const Icon = getTypeIcon(m.tipo);
                                
                                return (
                                    <div key={m.id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 overflow-hidden flex flex-col ${isUrgent ? 'border-rose-500' : 'border-indigo-500'}`}>
                                        <div className="p-5 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">{m.tipo}</h3>
                                                        <p className="text-xs text-slate-400 font-mono">#{m.id.substring(0,6)}</p>
                                                    </div>
                                                </div>
                                                {isUrgent && <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-md animate-pulse">URGENTE</span>}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Produto</p>
                                                    <p className="font-medium text-slate-800 truncate">{sku?.descritivo}</p>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase font-bold">Origem</p>
                                                        <p className="font-mono text-slate-700 font-bold">{origem?.codigo}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-400 uppercase font-bold">Qtd</p>
                                                        <p className="font-mono text-slate-700 font-bold">{m.quantidade} <span className="text-xs font-normal text-slate-500">{sku?.unidadeMedida}</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {m.status !== 'Concluída' && (
                                            <button 
                                                onClick={() => handleStart(m)}
                                                className="w-full py-3 bg-slate-50 hover:bg-indigo-50 text-indigo-600 font-bold text-sm border-t border-slate-100 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <PlayIcon className="h-4 w-4"/> {m.status === 'Pendente' ? 'INICIAR' : 'CONTINUAR'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Origem</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredMissions.map(m => {
                                        const sku = skus.find(s => s.id === m.skuId);
                                        const origem = enderecos.find(e => e.id === m.origemId);
                                        return (
                                            <tr key={m.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">#{m.id.substring(0,6)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{m.tipo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{sku?.sku} - {sku?.descritivo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{origem?.codigo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[m.status as keyof typeof STATUS_COLORS]}`}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {m.status !== 'Concluída' && (
                                                        <button onClick={() => handleStart(m)} className="text-indigo-600 hover:text-indigo-900 font-bold">
                                                            Abrir
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODALS (Kept rendered but hidden if printing to preserve state) */}
                {activeMission && (
                    <ExecutionWizard 
                        missao={activeMission} 
                        onClose={() => setActiveMission(null)} 
                        onComplete={() => setActiveMission(null)}
                        onPrint={handlePrintRequest}
                    />
                )}

                <PrinterConfigModal 
                    isOpen={isPrinterModalOpen} 
                    onClose={() => setIsPrinterModalOpen(false)} 
                    onTestPrint={() => handlePrintRequest()}
                />
            </div>
        </div>
    );
};

export default MissoesPage;
