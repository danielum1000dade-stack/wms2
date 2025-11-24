
import React, { useState, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { 
    MapPinIcon, CubeIcon, QrCodeIcon, CheckCircleIcon, 
    ArrowRightIcon, ArrowsRightLeftIcon, 
    ClipboardDocumentCheckIcon, TrashIcon, ExclamationTriangleIcon,
    HomeIcon, ArrowPathIcon, StopCircleIcon, InboxArrowDownIcon, LightBulbIcon
} from '@heroicons/react/24/outline';
import { EtiquetaStatus, AuditActionType, MissaoTipo } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

// --- TYPES & CONFIG ---
type OperationMode = 
    | 'MENU'
    | 'RECEBIMENTO'
    | 'PUTAWAY'
    | 'BAIXA_PALLET'
    | 'PICKING_EXECUTION'
    | 'RESSUPRIMENTO';

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
    useCamera?: boolean;
    validate: (input: string, context: any) => { valid: boolean; message?: string; nextContext?: any; autoAdvance?: boolean };
}

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
        getEtiquetaById, apontarEtiqueta, performFullPalletWriteOff,
        updateMissionStatus, assignNextMission, reportPickingShortage
    } = useWMS();

    const [mode, setMode] = useState<OperationMode>('MENU');
    const [stepIndex, setStepIndex] = useState(0);
    const [context, setContext] = useState<any>({});
    const [inputVal, setInputVal] = useState('');
    const [feedback, setFeedback] = useState<{ type: FeedbackType, message: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const currentUserId = 'admin_user';

    useEffect(() => {
        if (!feedback) {
            const focusInput = () => inputRef.current?.focus();
            focusInput();
        }
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

    // WORKFLOWS DEFINITIONS

    // 1. PUTAWAY (Intelligent)
    const putawaySteps: WizardStep[] = [
        {
            id: 0,
            title: "Armazenagem",
            prompt: "BIPE O PALLET",
            useCamera: true,
            icon: <CubeIcon className="h-16 w-16" />,
            inputType: 'text',
            bgColor: 'bg-indigo-50',
            accentColor: 'text-indigo-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et) return { valid: false, message: "Não encontrado" };
                if (et.status !== EtiquetaStatus.APONTADA) return { valid: false, message: "Status incorreto" };
                
                // Get AI Suggestion
                const suggestion = getBestPutawayAddress(et);
                if (!suggestion) return { valid: false, message: "Sem endereços disponíveis!" };

                return { valid: true, nextContext: { etiqueta: et, suggestion }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Armazenagem",
            prompt: "VÁ PARA A SUGESTÃO",
            subText: (ctx) => `Sugerido: ${ctx.suggestion.endereco.codigo}`,
            icon: <LightBulbIcon className="h-16 w-16 text-yellow-500" />,
            inputType: 'text',
            bgColor: 'bg-yellow-50',
            accentColor: 'text-yellow-600',
            useCamera: true,
            validate: (input, ctx) => {
                const scannedAddr = input.toUpperCase();
                const suggestedAddr = ctx.suggestion.endereco.codigo;
                
                // Allow scanning EITHER the suggestion OR a manual override
                const addrObj = enderecos.find(e => e.codigo === scannedAddr);
                
                if (!addrObj) return { valid: false, message: "Endereço inválido" };
                
                if (scannedAddr !== suggestedAddr) {
                    // Manual Override Warning/Check could go here
                    // For now, allow if valid
                }

                const res = armazenarEtiqueta(ctx.etiqueta.id, addrObj.id);
                if (!res.success) return { valid: false, message: res.message };
                
                return { valid: true, message: "ARMAZENADO COM SUCESSO", autoAdvance: true };
            }
        }
    ];

    // 2. RECEBIMENTO
    const recebimentoSteps: WizardStep[] = [
        {
            id: 0,
            title: "Recebimento",
            prompt: "BIPE A ETIQUETA",
            useCamera: true,
            icon: <InboxArrowDownIcon className="h-16 w-16" />,
            inputType: 'text',
            bgColor: 'bg-blue-50',
            accentColor: 'text-blue-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et || et.status !== EtiquetaStatus.PENDENTE_APONTAMENTO) return { valid: false, message: "Etiqueta inválida" };
                return { valid: true, nextContext: { etiqueta: et }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Recebimento",
            prompt: "BIPE O SKU",
            useCamera: true,
            icon: <QrCodeIcon className="h-16 w-16" />,
            inputType: 'text',
            bgColor: 'bg-white',
            accentColor: 'text-blue-600',
            validate: (input) => {
                const sku = skus.find(s => s.sku === input.toUpperCase());
                if (!sku) return { valid: false, message: "SKU desconhecido" };
                return { valid: true, nextContext: { sku }, autoAdvance: true };
            }
        },
        {
            id: 2,
            title: "Recebimento",
            prompt: "DIGITE A QUANTIDADE",
            subText: (ctx) => `${ctx.sku.descritivo}`,
            icon: <ClipboardDocumentCheckIcon className="h-16 w-16" />,
            inputType: 'number',
            bgColor: 'bg-green-50',
            accentColor: 'text-green-600',
            validate: (input, ctx) => {
                const qty = parseInt(input);
                if (isNaN(qty) || qty <= 0) return { valid: false, message: "Qtd Inválida" };
                apontarEtiqueta(ctx.etiqueta.id, { skuId: ctx.sku.id, quantidadeCaixas: qty });
                return { valid: true, message: "APONTAMENTO OK", autoAdvance: true };
            }
        }
    ];

    // ... Other workflows (Baixa, Picking, Ressuprimento) follow similar pattern but simplified for brevity here ...
    // They would also utilize useCamera: true in their respective steps.
    
    const pickingSteps: WizardStep[] = [
        { id: 0, title: "Picking", prompt: "INICIAR MISSÃO", icon: <ArrowPathIcon className="h-16 w-16"/>, inputType: 'text', bgColor: 'bg-white', accentColor: 'text-indigo', validate: () => {
            const m = assignNextMission(currentUserId);
            if(!m) return {valid:false, message: "Sem missões"};
            const addr = enderecos.find(e=>e.id===m.origemId);
            const sku = skus.find(s=>s.id===m.skuId);
            return {valid:true, nextContext:{mission:m, addr, sku}, autoAdvance:true};
        }},
        { id: 1, title: "Picking", prompt: "VÁ PARA O ENDEREÇO", subText: (ctx)=>ctx.addr.codigo, useCamera: true, icon: <MapPinIcon className="h-16 w-16"/>, inputType: 'text', bgColor: 'bg-blue-50', accentColor: 'text-blue', validate: (inp, ctx) => {
            if(inp.toUpperCase() !== ctx.addr.codigo) return {valid:false, message: "Endereço Errado"};
            return {valid:true, autoAdvance:true};
        }},
        { id: 2, title: "Picking", prompt: "BIPE O PRODUTO", subText: (ctx)=>ctx.sku.sku, useCamera: true, icon: <CubeIcon className="h-16 w-16"/>, inputType: 'text', bgColor: 'bg-white', accentColor: 'text-indigo', validate: (inp, ctx) => {
            if(inp.toUpperCase() !== ctx.sku.sku) return {valid:false, message: "Produto Errado"};
            return {valid:true, autoAdvance:true};
        }},
        { id: 3, title: "Picking", prompt: "CONFIRME QTD", subText: (ctx)=>`${ctx.mission.quantidade} cx`, icon: <ClipboardDocumentCheckIcon className="h-16 w-16"/>, inputType: 'number', bgColor: 'bg-green-50', accentColor: 'text-green', validate: (inp, ctx) => {
            updateMissionStatus(ctx.mission.id, 'Concluída', currentUserId, parseInt(inp));
            return {valid:true, message: "PICKING REALIZADO", autoAdvance:true};
        }}
    ];

    const getWorkflow = () => {
        switch (mode) {
            case 'PUTAWAY': return putawaySteps;
            case 'RECEBIMENTO': return recebimentoSteps;
            case 'PICKING_EXECUTION': return pickingSteps;
            default: return [];
        }
    };

    const steps = getWorkflow();
    const currentStep = steps[stepIndex];

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputVal && !(mode === 'PICKING_EXECUTION' && stepIndex === 0)) return;

        const result = currentStep.validate(inputVal.trim(), context);
        if (result.valid) {
            setFeedback({ type: 'success', message: result.message || 'OK' });
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
            }, 1000);
        } else {
            setFeedback({ type: 'error', message: result.message || 'Erro' });
            setInputVal('');
        }
    };

    const handleScan = (decoded: string) => {
        setInputVal(decoded);
        // Hacky delay to allow state update before submitting
        setTimeout(() => handleSubmit(), 100);
    };

    if (mode === 'MENU') {
        return (
            <div className="p-4 bg-gray-100 min-h-screen">
                <h1 className="text-center text-xl font-bold mb-6 text-gray-800">WMS Pro Mobile</h1>
                <div className="grid grid-cols-2 gap-4">
                    <MenuButton label="Recebimento" icon={InboxArrowDownIcon} color="text-blue-600" onClick={() => setMode('RECEBIMENTO')} badge={etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO).length} />
                    <MenuButton label="Armazenagem" icon={CubeIcon} color="text-indigo-600" onClick={() => setMode('PUTAWAY')} badge={etiquetas.filter(e => e.status === EtiquetaStatus.APONTADA).length} />
                    <MenuButton label="Picking" icon={ClipboardDocumentCheckIcon} color="text-green-600" onClick={() => setMode('PICKING_EXECUTION')} badge={missoes.filter(m => m.status === 'Pendente').length} />
                    <MenuButton label="Sair" icon={HomeIcon} color="text-gray-600" onClick={() => window.history.back()} />
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${currentStep?.bgColor || 'bg-white'}`}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white shadow-sm">
                <button onClick={reset} className="p-2 bg-gray-100 rounded-full"><HomeIcon className="h-6 w-6 text-gray-600"/></button>
                <h2 className="font-bold text-lg uppercase">{currentStep?.title}</h2>
                <div className="w-8"></div>
            </div>

            {/* Feedback Overlay */}
            {feedback && (
                <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in`}>
                    {feedback.type === 'error' ? <ExclamationTriangleIcon className="h-32 w-32 text-red-600 mb-4"/> : <CheckCircleIcon className="h-32 w-32 text-green-600 mb-4"/>}
                    <h3 className={`text-3xl font-black text-center px-4 ${feedback.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>{feedback.message}</h3>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-6">
                <div className={`p-6 rounded-full bg-white shadow-lg ${currentStep?.accentColor}`}>
                    {currentStep?.icon}
                </div>
                
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase mb-2">{currentStep?.prompt}</h2>
                    {currentStep?.subText && (
                        <div className="bg-white/60 px-4 py-2 rounded-lg border border-gray-200 inline-block">
                            <p className="text-xl font-bold text-gray-800">
                                {typeof currentStep.subText === 'function' ? currentStep.subText(context) : currentStep.subText}
                            </p>
                        </div>
                    )}
                </div>

                {/* Camera Area */}
                {currentStep?.useCamera && !feedback && (
                    <div className="w-full max-w-xs h-64 bg-black rounded-lg overflow-hidden shadow-inner border-2 border-gray-300 relative">
                        <BarcodeScanner onScanSuccess={handleScan} />
                    </div>
                )}
            </div>

            {/* Manual Input Footer */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="relative">
                    <input 
                        ref={inputRef}
                        type={currentStep?.inputType || 'text'}
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        className="w-full h-14 pl-4 pr-14 text-xl border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:ring-0 uppercase font-mono"
                        placeholder="Digitar código..."
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-md">
                        <ArrowRightIcon className="h-6 w-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OperadorPage;
