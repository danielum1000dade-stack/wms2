
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo, SKU, Endereco, User } from '../types';
import { 
    CubeIcon, ArrowRightIcon, FlagIcon, TrashIcon, UserCircleIcon, 
    PlayIcon, CheckCircleIcon, ArrowUturnLeftIcon, FunnelIcon, 
    ExclamationTriangleIcon, ClockIcon, CameraIcon, XMarkIcon,
    MapPinIcon, QrCodeIcon, HandRaisedIcon, LightBulbIcon
} from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';

// --- CONFIGURAÇÕES VISUAIS ---
const PRIORITY_CONFIG = {
    URGENTE: { label: 'URGENTE', color: 'bg-red-100 text-red-800 border-red-200', iconColor: 'text-red-600' },
    ALTA: { label: 'ALTA', color: 'bg-orange-100 text-orange-800 border-orange-200', iconColor: 'text-orange-600' },
    MEDIA: { label: 'MÉDIA', color: 'bg-blue-100 text-blue-800 border-blue-200', iconColor: 'text-blue-600' },
    BAIXA: { label: 'BAIXA', color: 'bg-gray-100 text-gray-800 border-gray-200', iconColor: 'text-gray-500' },
};

const TYPE_ICONS = {
    [MissaoTipo.PICKING]: CubeIcon,
    [MissaoTipo.ARMAZENAGEM]: ArrowRightIcon, // Representando entrada
    [MissaoTipo.REABASTECIMENTO]: ArrowUturnLeftIcon, // Ciclo
    [MissaoTipo.MOVIMENTACAO]: ArrowRightIcon,
    [MissaoTipo.MOVIMENTACAO_PALLET]: CubeIcon,
    [MissaoTipo.CONFERENCIA_CEGA]: CheckCircleIcon,
    [MissaoTipo.INVENTARIO]: CheckCircleIcon,
    [MissaoTipo.TRANSFERENCIA]: ArrowRightIcon
};

// --- SUB-COMPONENTES ---

// 1. DASHBOARD HEADER (KPIs)
const MissionDashboard: React.FC<{ missoes: Missao[] }> = ({ missoes }) => {
    const stats = useMemo(() => {
        return {
            total: missoes.length,
            pendentes: missoes.filter(m => m.status === 'Pendente').length,
            emAndamento: missoes.filter(m => m.status === 'Em Andamento').length,
            urgentes: missoes.filter(m => m.prioridadeScore && m.prioridadeScore > 80).length, // Mock logic for urgency
            concluidasHoje: missoes.filter(m => m.status === 'Concluída').length // Mock: filter by date in real app
        };
    }, [missoes]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase">Pendentes</span>
                <span className="text-2xl font-bold text-gray-800">{stats.pendentes}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col">
                <span className="text-xs font-bold text-blue-400 uppercase">Em Execução</span>
                <span className="text-2xl font-bold text-blue-600">{stats.emAndamento}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col">
                <span className="text-xs font-bold text-red-400 uppercase">Urgentes</span>
                <span className="text-2xl font-bold text-red-600">{stats.urgentes}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col">
                <span className="text-xs font-bold text-green-400 uppercase">Produtividade (H)</span>
                <span className="text-2xl font-bold text-green-600">98%</span>
            </div>
        </div>
    );
};

// 2. MISSION CARD (LIST VIEW)
const MissionCard: React.FC<{ 
    missao: Missao, 
    onStart: (m: Missao) => void 
}> = ({ missao, onStart }) => {
    const { skus, enderecos, users } = useWMS();
    const sku = skus.find(s => s.id === missao.skuId);
    const origem = enderecos.find(e => e.id === missao.origemId);
    const destino = enderecos.find(e => e.id === missao.destinoId);
    const operador = users.find(u => u.id === missao.operadorId);
    
    // Determine Priority Visuals
    const isUrgent = (missao.prioridadeScore || 0) > 80;
    const style = isUrgent ? PRIORITY_CONFIG.URGENTE : PRIORITY_CONFIG.MEDIA;
    const Icon = TYPE_ICONS[missao.tipo] || CubeIcon;

    return (
        <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 hover:shadow-md transition-shadow ${style.color.split(' ')[2]}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-opacity-20 ${style.color.split(' ')[0]}`}>
                        <Icon className={`h-6 w-6 ${style.iconColor}`} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            {missao.tipo}
                            {isUrgent && <span className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded-full animate-pulse">URGENTE</span>}
                        </h4>
                        <p className="text-xs text-gray-500 font-mono">ID: {missao.id.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        missao.status === 'Pendente' ? 'bg-gray-100 text-gray-600' :
                        missao.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                        {missao.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-xs text-gray-400 uppercase">Produto</p>
                    <p className="font-bold text-gray-800 truncate">{sku?.descritivo || 'Desconhecido'}</p>
                    <p className="text-xs text-gray-500">{sku?.sku}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Quantidade</p>
                    <p className="font-bold text-gray-800 text-lg">{missao.quantidade} <span className="text-xs font-normal text-gray-500">{sku?.unidadeMedida}</span></p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span>{origem?.codigo || 'Origem'}</span>
                    <ArrowRightIcon className="h-3 w-3 text-gray-300" />
                    <span>{destino?.codigo || 'Destino'}</span>
                </div>
                {missao.status !== 'Concluída' && (
                    <button 
                        onClick={() => onStart(missao)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <PlayIcon className="h-4 w-4" />
                        {missao.status === 'Pendente' ? 'INICIAR' : 'CONTINUAR'}
                    </button>
                )}
            </div>
        </div>
    );
};

// 3. OPERATOR MODE (WIZARD)
interface WizardProps {
    missao: Missao;
    onClose: () => void;
    onComplete: () => void;
}

const OperatorWizard: React.FC<WizardProps> = ({ missao, onClose, onComplete }) => {
    const { skus, enderecos, updateMissionStatus, reportPickingShortage } = useWMS();
    const [step, setStep] = useState(0);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [showDivergence, setShowDivergence] = useState(false);

    const sku = skus.find(s => s.id === missao.skuId);
    const origem = enderecos.find(e => e.id === missao.origemId);
    const destino = enderecos.find(e => e.id === missao.destinoId);

    const steps = [
        {
            id: 'origin',
            title: 'Ir para Origem',
            instruction: 'Dirija-se ao endereço e bipe a posição.',
            target: origem?.codigo,
            icon: MapPinIcon,
            validate: (val: string) => val.toUpperCase() === origem?.codigo.toUpperCase()
        },
        {
            id: 'product',
            title: 'Confirmar Produto',
            instruction: `Bipe o SKU ou LPN do produto.`,
            subInstruction: `Qtd: ${missao.quantidade} ${sku?.unidadeMedida}`,
            target: sku?.sku, // Or LPN logic
            icon: CubeIcon,
            validate: (val: string) => val.toUpperCase() === sku?.sku.toUpperCase() || val.toUpperCase() === missao.etiquetaId
        },
        {
            id: 'destination',
            title: 'Ir para Destino',
            instruction: 'Leve o material e bipe o endereço de destino.',
            target: destino?.codigo, // If destination is dynamic, show suggestion logic here
            icon: FlagIcon,
            validate: (val: string) => val.toUpperCase() === destino?.codigo.toUpperCase()
        },
        {
            id: 'confirm',
            title: 'Finalizar',
            instruction: 'Confirme a quantidade depositada.',
            target: null,
            icon: CheckCircleIcon,
            isConfirmation: true
        }
    ];

    const currentStep = steps[step];

    const handleNext = () => {
        if (currentStep.isConfirmation) {
            updateMissionStatus(missao.id, 'Concluída');
            onComplete();
            return;
        }

        if (currentStep.validate && currentStep.validate(input)) {
            setError('');
            setInput('');
            setStep(prev => prev + 1);
        } else {
            setError('Código incorreto. Tente novamente.');
            // Vibrate for tactile feedback
            if (navigator.vibrate) navigator.vibrate(200);
        }
    };

    const handleScan = (decoded: string) => {
        setInput(decoded);
        setIsScanning(false);
        // Auto-submit on successful scan
        setTimeout(() => {
            const btn = document.getElementById('next-step-btn');
            if(btn) btn.click();
        }, 100);
    };

    const handleReportShortage = () => {
        if (confirm("Confirmar RUPTURA (Falta de produto) neste endereço?")) {
            reportPickingShortage(missao.id, 'operador_atual'); // Mock user
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Header Full Screen */}
            <div className="bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="bg-white text-indigo-900 text-xs px-2 py-1 rounded font-black">#{step + 1}</span>
                        {currentStep.title}
                    </h2>
                    <p className="text-xs text-indigo-200">Missão: {missao.tipo} - {missao.id.substring(0, 8)}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-indigo-800 rounded-full">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                {/* Visual Guide */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className={`p-6 rounded-full bg-indigo-50 border-4 border-indigo-100`}>
                        <currentStep.icon className="h-24 w-24 text-indigo-600" />
                    </div>
                    
                    <div className="text-center w-full">
                        <h1 className="text-4xl font-black text-gray-900 break-words mb-2">
                            {currentStep.target || 'Confirmar'}
                        </h1>
                        <p className="text-lg text-gray-600 font-medium px-4">
                            {currentStep.instruction}
                        </p>
                        {currentStep.subInstruction && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg inline-block">
                                <span className="text-xl font-bold text-yellow-800">{currentStep.subInstruction}</span>
                            </div>
                        )}
                    </div>

                    {/* Product Info Card (Always visible for context) */}
                    <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 font-bold">IMG</div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-gray-800 truncate">{sku?.descritivo}</p>
                            <p className="text-sm text-gray-500">{sku?.sku}</p>
                        </div>
                    </div>
                </div>

                {/* Camera / Input Area */}
                <div className="mt-auto pt-4 space-y-4">
                    {error && (
                        <div className="bg-red-100 text-red-800 p-3 rounded-lg flex items-center animate-shake">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2"/>
                            {error}
                        </div>
                    )}

                    {!isScanning ? (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={e => setInput(e.target.value.toUpperCase())}
                                    placeholder="Digitar ou ler código..."
                                    className="w-full pl-10 pr-4 py-4 text-xl font-mono border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-0"
                                    autoFocus
                                />
                                <QrCodeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                            </div>
                            <button 
                                onClick={() => setIsScanning(true)}
                                className="bg-gray-900 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
                            >
                                <CameraIcon className="h-8 w-8" />
                            </button>
                        </div>
                    ) : (
                        <div className="h-64 bg-black rounded-xl overflow-hidden relative border-4 border-indigo-500">
                            <BarcodeScanner onScanSuccess={handleScan} />
                            <button 
                                onClick={() => setIsScanning(false)}
                                className="absolute top-2 right-2 bg-white/20 p-2 rounded-full text-white z-10"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    )}

                    <button 
                        id="next-step-btn"
                        onClick={handleNext}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
                    >
                        {currentStep.isConfirmation ? 'FINALIZAR TAREFA' : 'CONFIRMAR'}
                        <ArrowRightIcon className="h-6 w-6" />
                    </button>

                    {/* Problem Reporting */}
                    <div className="flex justify-center gap-4 pt-2">
                        <button onClick={() => setShowDivergence(!showDivergence)} className="text-gray-500 text-sm font-medium underline">
                            Relatar Problema
                        </button>
                    </div>
                    
                    {showDivergence && (
                        <div className="grid grid-cols-2 gap-2 animate-fade-in-up">
                            <button onClick={handleReportShortage} className="bg-red-100 text-red-700 py-2 rounded-lg font-bold text-sm hover:bg-red-200">
                                RUPTURA (Não achei)
                            </button>
                            <button className="bg-yellow-100 text-yellow-700 py-2 rounded-lg font-bold text-sm hover:bg-yellow-200">
                                AVARIA / DANO
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---

const MissoesPage: React.FC = () => {
    const { missoes, users, updateMissionStatus } = useWMS();
    const [activeMission, setActiveMission] = useState<Missao | null>(null);
    const [filterType, setFilterType] = useState<string>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock current user
    const currentUserId = 'admin_user'; 

    const filteredMissions = useMemo(() => {
        return missoes.filter(m => {
            const matchesType = filterType === 'TODOS' || m.tipo === filterType;
            const matchesSearch = searchTerm === '' || m.id.includes(searchTerm) || m.etiquetaId.includes(searchTerm);
            return matchesType && matchesSearch && m.status !== 'Concluída'; // Show active only
        }).sort((a, b) => (b.prioridadeScore || 0) - (a.prioridadeScore || 0));
    }, [missoes, filterType, searchTerm]);

    const handleStartMission = (m: Missao) => {
        // Se já estiver atribuída a outro, avisar (regra de negócio simplificada)
        if (m.operadorId && m.operadorId !== currentUserId && m.status === 'Em Andamento') {
            alert("Esta missão já está sendo executada por outro operador.");
            return;
        }
        
        // Atribuir e mudar status
        if (m.status === 'Pendente') {
            updateMissionStatus(m.id, 'Em Andamento', currentUserId);
        }
        
        setActiveMission(m);
    };

    const handleMissionComplete = () => {
        setActiveMission(null);
        // Feedback visual or sound could go here
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 1. HEADER DA PÁGINA */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Missões</h1>
                    <p className="text-sm text-gray-500 hidden md:block">Gerenciamento de tarefas em tempo real</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar missão..." 
                            className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-40 md:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <FunnelIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="p-4 max-w-7xl mx-auto">
                {/* 2. KPI DASHBOARD */}
                <MissionDashboard missoes={missoes} />

                {/* 3. FILTROS RÁPIDOS (Pills) */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                    {['TODOS', MissaoTipo.PICKING, MissaoTipo.ARMAZENAGEM, MissaoTipo.REABASTECIMENTO].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                                filterType === type 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {type === 'TODOS' ? 'Todas as Tarefas' : type}
                        </button>
                    ))}
                </div>

                {/* 4. LISTA DE MISSÕES */}
                {filteredMissions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <HandRaisedIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">Tudo Limpo!</h3>
                        <p className="text-gray-500">Não há missões pendentes para os filtros selecionados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMissions.map(mission => (
                            <MissionCard 
                                key={mission.id} 
                                missao={mission} 
                                onStart={handleStartMission} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 5. MODO OPERADOR (OVERLAY) */}
            {activeMission && (
                <OperatorWizard 
                    missao={activeMission} 
                    onClose={() => setActiveMission(null)} 
                    onComplete={handleMissionComplete}
                />
            )}
        </div>
    );
};

export default MissoesPage;
