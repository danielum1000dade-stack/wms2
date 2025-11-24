
import React, { useState, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { 
    MapPinIcon, CubeIcon, QrCodeIcon, CheckCircleIcon, 
    ArrowRightIcon, MagnifyingGlassIcon, ArrowsRightLeftIcon, 
    ClipboardDocumentCheckIcon, TrashIcon, ExclamationTriangleIcon,
    HomeIcon, TruckIcon, InboxArrowDownIcon, ArrowPathIcon, StopCircleIcon
} from '@heroicons/react/24/outline';
import { EtiquetaStatus, EnderecoStatus, AuditActionType, MissaoTipo, EnderecoTipo } from '../types';

// --- TYPES & CONFIG ---
type OperationMode = 
    | 'MENU'
    | 'RECEBIMENTO'
    | 'PUTAWAY'
    | 'MOVIMENTACAO'
    | 'INVENTARIO'
    | 'CONSULTA'
    | 'RESSUPRIMENTO'
    | 'BAIXA_PALLET'
    | 'PICKING_EXECUTION';

type FeedbackType = 'success' | 'error' | 'neutral';

interface WizardStep {
    id: number;
    title: string;
    prompt: string;
    subText?: string | ((ctx: any) => string);
    icon: React.ReactNode;
    inputType: 'text' | 'number';
    bgColor: string; 
    accentColor: string; 
    validate: (input: string, context: any) => { valid: boolean; message?: string; nextContext?: any; autoAdvance?: boolean };
}

// --- COMPONENTS ---

const MenuButton: React.FC<{ 
    label: string; 
    icon: React.ElementType; 
    color: string; 
    onClick: () => void; 
    badge?: number;
}> = ({ label, icon: Icon, color, onClick, badge }) => (
    <button 
        onClick={onClick}
        className="relative flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 transition-all active:scale-95 active:bg-gray-50 h-28 w-full"
    >
        <div className={`p-3 rounded-full mb-2 ${color.replace('text-', 'bg-').replace('600', '100')}`}>
            <Icon className={`h-8 w-8 ${color}`} />
        </div>
        <span className="font-bold text-gray-700 text-xs leading-tight text-center">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                {badge}
            </span>
        )}
    </button>
);

const OperadorPage: React.FC = () => {
    const { 
        etiquetas, enderecos, skus, missoes,
        getBestPutawayAddress, armazenarEtiqueta, 
        getEtiquetaById, logEvent, apontarEtiqueta, performFullPalletWriteOff,
        updateMissionStatus, assignNextMission, checkReplenishmentNeeds, reportPickingShortage
    } = useWMS();

    const [mode, setMode] = useState<OperationMode>('MENU');
    const [stepIndex, setStepIndex] = useState(0);
    const [context, setContext] = useState<any>({});
    const [inputVal, setInputVal] = useState('');
    const [feedback, setFeedback] = useState<{ type: FeedbackType, message: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const currentUserId = 'admin_user'; // Hardcoded for prototype

    // Focus management
    useEffect(() => {
        const focusInput = () => inputRef.current?.focus();
        focusInput();
        const interval = setInterval(focusInput, 2000);
        window.addEventListener('click', focusInput); 
        return () => {
            clearInterval(interval);
            window.removeEventListener('click', focusInput);
        };
    }, [stepIndex, mode, feedback]);

    const reset = () => {
        setMode('MENU');
        setStepIndex(0);
        setContext({});
        setInputVal('');
        setFeedback(null);
    };

    const goToNextStep = (updates: any = {}) => {
        setContext(prev => ({ ...prev, ...updates }));
        setStepIndex(prev => prev + 1);
        setInputVal('');
        setFeedback(null);
    };

    const handleReportShortage = () => {
        if (mode === 'PICKING_EXECUTION' && context.mission) {
            if(confirm("Confirmar FALTA de produto? Isso irá gerar um alerta e uma missão de ressuprimento.")){
                reportPickingShortage(context.mission.id, currentUserId);
                setFeedback({ type: 'error', message: "FALTA REPORTADA - RESSUPRIMENTO ACIONADO" });
                setTimeout(reset, 2000);
            }
        }
    };

    // --- WORKFLOWS ---

    // 1. RECEBIMENTO (Conferência Cega/Apontamento)
    const recebimentoSteps: WizardStep[] = [
        {
            id: 0,
            title: "Recebimento",
            prompt: "BIPE A ETIQUETA",
            subText: "Etiqueta de Recebimento Pendente",
            icon: <InboxArrowDownIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-blue-50',
            accentColor: 'text-blue-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et) return { valid: false, message: "Etiqueta não encontrada" };
                if (et.status !== EtiquetaStatus.PENDENTE_APONTAMENTO) return { valid: false, message: `Status incorreto: ${et.status}` };
                return { valid: true, nextContext: { etiqueta: et }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Recebimento",
            prompt: "BIPE O PRODUTO (SKU)",
            subText: (ctx) => `LPN: ${ctx.etiqueta.id}`,
            icon: <QrCodeIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-white',
            accentColor: 'text-blue-600',
            validate: (input, ctx) => {
                const sku = skus.find(s => s.sku === input.toUpperCase());
                if (!sku) return { valid: false, message: "SKU não encontrado" };
                return { valid: true, nextContext: { sku }, autoAdvance: true };
            }
        },
        {
            id: 2,
            title: "Recebimento",
            prompt: "DIGITE A QUANTIDADE",
            subText: (ctx) => `SKU: ${ctx.sku.descritivo}`,
            icon: <ClipboardDocumentCheckIcon className="h-20 w-20" />,
            inputType: 'number',
            bgColor: 'bg-green-50',
            accentColor: 'text-green-600',
            validate: (input, ctx) => {
                const qty = parseInt(input);
                if (isNaN(qty) || qty <= 0) return { valid: false, message: "Qtd Inválida" };
                if (qty > ctx.sku.totalCaixas) return { valid: false, message: `Máximo ${ctx.sku.totalCaixas} cx/pallet` };
                
                apontarEtiqueta(ctx.etiqueta.id, { skuId: ctx.sku.id, quantidadeCaixas: qty });
                return { valid: true, message: "APONTAMENTO REALIZADO", autoAdvance: true };
            }
        }
    ];

    // 2. PUTAWAY
    const putawaySteps: WizardStep[] = [
        {
            id: 0,
            title: "Armazenagem",
            prompt: "BIPE O PALLET",
            icon: <CubeIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-indigo-50',
            accentColor: 'text-indigo-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et) return { valid: false, message: "Não encontrado" };
                if (et.status !== EtiquetaStatus.APONTADA) return { valid: false, message: "Pallet não aguarda armazenagem" };
                
                const suggestion = getBestPutawayAddress(et);
                return { valid: true, nextContext: { etiqueta: et, suggestion }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Armazenagem",
            prompt: "VÁ PARA O DESTINO",
            subText: (ctx) => ctx.suggestion ? `Sugerido: ${ctx.suggestion.endereco.codigo}` : "Escolha posição livre",
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-yellow-50',
            accentColor: 'text-yellow-600',
            validate: (input, ctx) => {
                const addr = enderecos.find(e => e.codigo === input.toUpperCase());
                if (!addr) return { valid: false, message: "Endereço Inválido" };
                
                const res = armazenarEtiqueta(ctx.etiqueta.id, addr.id);
                if (!res.success) return { valid: false, message: res.message };
                return { valid: true, message: "ARMAZENADO COM SUCESSO", autoAdvance: true };
            }
        }
    ];

    // 3. BAIXA TOTAL (Destruição/Consumo)
    const baixaSteps: WizardStep[] = [
        {
            id: 0,
            title: "Baixa de Pallet",
            prompt: "BIPE O PALLET A BAIXAR",
            icon: <TrashIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-red-50',
            accentColor: 'text-red-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et) return { valid: false, message: "Não encontrado" };
                if (et.status !== EtiquetaStatus.ARMAZENADA) return { valid: false, message: "Pallet precisa estar armazenado" };
                return { valid: true, nextContext: { etiqueta: et }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Baixa de Pallet",
            prompt: "MOTIVO DA BAIXA",
            subText: "Digite: Avaria, Consumo, Perda...",
            icon: <ExclamationTriangleIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-red-50',
            accentColor: 'text-red-600',
            validate: (input, ctx) => {
                if (input.length < 3) return { valid: false, message: "Motivo muito curto" };
                const res = performFullPalletWriteOff(ctx.etiqueta.id, input, currentUserId);
                if (!res.success) return { valid: false, message: res.message };
                return { valid: true, message: "PALLET BAIXADO", autoAdvance: true };
            }
        }
    ];

    // 4. PICKING EXECUTION
    const pickingSteps: WizardStep[] = [
        {
            id: 0,
            title: "Picking",
            prompt: "INICIAR MISSÃO",
            subText: "Toque para buscar a próxima tarefa",
            icon: <ArrowPathIcon className="h-20 w-20" />,
            inputType: 'text', // Dummy
            bgColor: 'bg-white',
            accentColor: 'text-indigo-600',
            validate: (input) => {
                const mission = assignNextMission(currentUserId);
                if (!mission) return { valid: false, message: "Nenhuma missão disponível" };
                
                const addr = enderecos.find(e => e.id === mission.origemId);
                const sku = skus.find(s => s.id === mission.skuId);
                const et = etiquetas.find(e => e.id === mission.etiquetaId);
                
                return { valid: true, nextContext: { mission, addr, sku, et }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Picking",
            prompt: "VÁ PARA O ENDEREÇO",
            subText: (ctx) => `${ctx.addr?.codigo}`,
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-blue-50',
            accentColor: 'text-blue-600',
            validate: (input, ctx) => {
                if (input.toUpperCase() !== ctx.addr.codigo) return { valid: false, message: "Endereço Incorreto" };
                return { valid: true, autoAdvance: true };
            }
        },
        {
            id: 2,
            title: "Picking",
            prompt: "BIPE O PRODUTO",
            subText: (ctx) => `${ctx.sku.sku} - ${ctx.sku.descritivo}`,
            icon: <CubeIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-white',
            accentColor: 'text-indigo-600',
            validate: (input, ctx) => {
                if (input.toUpperCase() !== ctx.sku.sku) return { valid: false, message: "Produto Incorreto" };
                return { valid: true, autoAdvance: true };
            }
        },
        {
            id: 3,
            title: "Picking",
            prompt: "CONFIRME A QTD",
            subText: (ctx) => `Solicitado: ${ctx.mission.quantidade} CX`,
            icon: <ClipboardDocumentCheckIcon className="h-20 w-20" />,
            inputType: 'number',
            bgColor: 'bg-green-50',
            accentColor: 'text-green-600',
            validate: (input, ctx) => {
                const qty = parseInt(input);
                if (qty !== ctx.mission.quantidade) {
                    if (qty < ctx.mission.quantidade) {
                        // Allow partial pick but confirm
                        return { valid: false, message: "Qtd menor. Relate falta se necessário." };
                    }
                    return { valid: false, message: "Qtd maior que solicitado." };
                }
                updateMissionStatus(ctx.mission.id, 'Concluída', currentUserId, qty);
                return { valid: true, message: "TAREFA CONCLUÍDA", autoAdvance: true };
            }
        }
    ];

    // 5. RESSUPRIMENTO
    const replenishmentSteps: WizardStep[] = [
        {
            id: 0,
            title: "Ressuprimento",
            prompt: "BUSCAR MISSÃO",
            icon: <ArrowPathIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-orange-50',
            accentColor: 'text-orange-600',
            validate: (input) => {
                // Find replenishment mission specifically
                const mission = missoes.find(m => m.tipo === MissaoTipo.REABASTECIMENTO && m.status === 'Pendente');
                if (!mission) return { valid: false, message: "Nenhum ressuprimento pendente" };
                
                // Assign
                updateMissionStatus(mission.id, 'Atribuída', currentUserId);
                
                const origem = enderecos.find(e => e.id === mission.origemId);
                const destino = enderecos.find(e => e.id === mission.destinoId);
                const et = etiquetas.find(e => e.id === mission.etiquetaId);
                const sku = skus.find(s => s.id === mission.skuId);

                return { valid: true, nextContext: { mission, origem, destino, et, sku }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Ressuprimento",
            prompt: "PEGUE NO AÉREO",
            subText: (ctx) => `Vá para: ${ctx.origem.codigo}`,
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-blue-50',
            accentColor: 'text-blue-600',
            validate: (input, ctx) => {
                if (input.toUpperCase() !== ctx.origem.codigo) return { valid: false, message: "Endereço Origem Incorreto" };
                return { valid: true, autoAdvance: true };
            }
        },
        {
            id: 2,
            title: "Ressuprimento",
            prompt: "BIPE O PALLET",
            subText: (ctx) => `LPN: ${ctx.et.id}`,
            icon: <CubeIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-white',
            accentColor: 'text-orange-600',
            validate: (input, ctx) => {
                if (input.toUpperCase() !== ctx.et.id) return { valid: false, message: "Pallet Incorreto" };
                return { valid: true, autoAdvance: true };
            }
        },
        {
            id: 3,
            title: "Ressuprimento",
            prompt: "LEVE AO PICKING",
            subText: (ctx) => `Destino: ${ctx.destino.codigo}`,
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-yellow-50',
            accentColor: 'text-yellow-600',
            validate: (input, ctx) => {
                if (input.toUpperCase() !== ctx.destino.codigo) return { valid: false, message: "Endereço Destino Incorreto" };
                
                updateMissionStatus(ctx.mission.id, 'Concluída', currentUserId);
                return { valid: true, message: "RESSUPRIMENTO CONCLUÍDO", autoAdvance: true };
            }
        }
    ];

    // --- ENGINE SELECTION ---
    const getWorkflow = () => {
        switch (mode) {
            case 'RECEBIMENTO': return recebimentoSteps;
            case 'PUTAWAY': return putawaySteps;
            case 'BAIXA_PALLET': return baixaSteps;
            case 'PICKING_EXECUTION': return pickingSteps;
            case 'RESSUPRIMENTO': return replenishmentSteps;
            default: return [];
        }
    };

    const steps = getWorkflow();
    const currentStep = steps[stepIndex];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Picking Execution Step 0 is just a "Start" button essentially, allows empty input
        if (!inputVal.trim() && !(mode === 'PICKING_EXECUTION' && stepIndex === 0) && !(mode === 'RESSUPRIMENTO' && stepIndex === 0)) return;

        setFeedback(null);
        const result = currentStep.validate(inputVal.trim(), context);

        if (result.valid) {
            setFeedback({ type: 'success', message: result.message || 'OK' });
            if (navigator.vibrate) navigator.vibrate(50);

            setTimeout(() => {
                if (result.autoAdvance) {
                    if (stepIndex >= steps.length - 1) {
                        setStepIndex(0);
                        setContext({});
                        setFeedback(null);
                        setInputVal('');
                    } else {
                        goToNextStep(result.nextContext);
                    }
                }
            }, result.message ? 1500 : 500);
        } else {
            setFeedback({ type: 'error', message: result.message || 'Erro' });
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setInputVal('');
        }
    };

    // --- RENDER ---

    if (mode === 'MENU') {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <div className="bg-white p-4 shadow-sm mb-4">
                    <h1 className="text-xl font-extrabold text-gray-800 text-center">WMS Pro Mobile</h1>
                    <p className="text-xs text-gray-500 text-center">Selecione a operação</p>
                </div>
                <div className="flex-1 px-4 pb-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        <MenuButton 
                            label="Recebimento" 
                            icon={InboxArrowDownIcon} 
                            color="text-blue-600" 
                            onClick={() => setMode('RECEBIMENTO')}
                            badge={etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO).length}
                        />
                        <MenuButton 
                            label="Armazenagem" 
                            icon={CubeIcon} 
                            color="text-indigo-600" 
                            onClick={() => setMode('PUTAWAY')}
                            badge={etiquetas.filter(e => e.status === EtiquetaStatus.APONTADA).length}
                        />
                        <MenuButton 
                            label="Picking" 
                            icon={ClipboardDocumentCheckIcon} 
                            color="text-green-600" 
                            onClick={() => setMode('PICKING_EXECUTION')}
                            badge={missoes.filter(m => m.status === 'Pendente' && m.tipo === MissaoTipo.PICKING).length}
                        />
                        <MenuButton 
                            label="Ressuprimento" 
                            icon={ArrowPathIcon} 
                            color="text-orange-600" 
                            onClick={() => setMode('RESSUPRIMENTO')}
                            badge={missoes.filter(m => m.status === 'Pendente' && m.tipo === MissaoTipo.REABASTECIMENTO).length}
                        />
                        <MenuButton 
                            label="Baixa Pallet" 
                            icon={TrashIcon} 
                            color="text-red-600" 
                            onClick={() => setMode('BAIXA_PALLET')}
                        />
                        <MenuButton 
                            label="Movimentação" 
                            icon={ArrowsRightLeftIcon} 
                            color="text-gray-600" 
                            onClick={() => alert("Use 'Armazenagem' para mover pallets")} // Simplified for now
                        />
                    </div>
                </div>
            </div>
        );
    }

    const isError = feedback?.type === 'error';
    const isSuccess = feedback?.type === 'success';
    let bgClass = currentStep?.bgColor || 'bg-white';
    if (isError) bgClass = 'bg-red-100';
    if (isSuccess) bgClass = 'bg-green-100';

    return (
        <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${bgClass}`}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white shadow-md z-10">
                <button onClick={reset} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <HomeIcon className="h-6 w-6" />
                </button>
                <h2 className="font-bold text-gray-800 text-lg uppercase tracking-wide">{currentStep?.title}</h2>
                <div className="w-8"></div>
            </div>

            {/* Progress */}
            <div className="flex h-1 bg-gray-200">
                {steps.map((s, i) => (
                    <div key={s.id} className={`flex-1 ${i <= stepIndex ? 'bg-indigo-600' : 'bg-transparent'}`} />
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
                {feedback ? (
                    <div className="animate-fade-in-up w-full">
                        {isError ? (
                            <ExclamationTriangleIcon className="h-32 w-32 text-red-600 mx-auto mb-6" />
                        ) : (
                            <CheckCircleIcon className="h-32 w-32 text-green-600 mx-auto mb-6" />
                        )}
                        <h3 className={`text-3xl font-black whitespace-pre-wrap ${isError ? 'text-red-700' : 'text-green-700'}`}>
                            {feedback.message}
                        </h3>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center">
                        <div className={`p-8 rounded-full bg-white shadow-xl mb-8 ${currentStep?.accentColor}`}>
                            {currentStep?.icon}
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 uppercase leading-none mb-4 tracking-tight">
                            {currentStep?.prompt}
                        </h2>
                        {currentStep?.subText && (
                            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xl font-bold text-gray-700">
                                    {typeof currentStep.subText === 'function' ? currentStep.subText(context) : currentStep.subText}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Emergency Buttons */}
                {mode === 'PICKING_EXECUTION' && stepIndex > 0 && !feedback && (
                    <button 
                        onClick={handleReportShortage}
                        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 px-4 py-2 rounded-full flex items-center text-sm font-bold shadow-sm hover:bg-red-200"
                    >
                        <StopCircleIcon className="h-5 w-5 mr-2" /> Reportar Falta
                    </button>
                )}
            </div>

            {/* Footer Input */}
            <div className="bg-white p-4 pb-6 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
                    <input
                        ref={inputRef}
                        type={currentStep?.inputType || 'text'}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        className={`w-full h-16 pl-4 pr-16 text-2xl font-bold border-4 rounded-xl focus:outline-none focus:ring-0 transition-all uppercase
                            ${isError ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-300' : 
                              isSuccess ? 'border-green-500 bg-green-50 text-green-900' : 
                              'border-indigo-600 text-gray-900'}`}
                        placeholder=""
                        autoFocus
                        // Allow submitting empty on picking start step
                        disabled={!!feedback && feedback.type !== 'neutral'} 
                    />
                    <button 
                        type="submit"
                        className="absolute right-3 top-3 bottom-3 bg-indigo-600 text-white px-4 rounded-lg disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
                    >
                        <ArrowRightIcon className="h-8 w-8" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OperadorPage;
