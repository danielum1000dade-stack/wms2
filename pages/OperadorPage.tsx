
import React, { useState, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { 
    MapPinIcon, CubeIcon, QrCodeIcon, CheckCircleIcon, 
    ArrowRightIcon, MagnifyingGlassIcon, ArrowsRightLeftIcon, 
    ClipboardDocumentCheckIcon, XMarkIcon, ExclamationTriangleIcon,
    HomeIcon
} from '@heroicons/react/24/outline';
import { EtiquetaStatus, EnderecoStatus, AuditActionType } from '../types';

// --- TYPES & CONFIG ---
type OperationMode = 
    | 'MENU'
    | 'PUTAWAY'
    | 'MOVIMENTACAO'
    | 'INVENTARIO'
    | 'CONSULTA';

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
    // Validation returns success status, message, and optional data updates for the context
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
        className="relative flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 transition-all active:scale-95 active:bg-gray-50 h-32 w-full"
    >
        <div className={`p-3 rounded-full mb-2 ${color.replace('text-', 'bg-').replace('600', '100')}`}>
            <Icon className={`h-8 w-8 ${color}`} />
        </div>
        <span className="font-bold text-gray-700 text-sm leading-tight text-center">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                {badge}
            </span>
        )}
    </button>
);

const OperadorPage: React.FC = () => {
    const { 
        etiquetas, enderecos, skus, 
        getBestPutawayAddress, armazenarEtiqueta, 
        getEtiquetaById, logEvent, apontarEtiqueta 
    } = useWMS();

    const [mode, setMode] = useState<OperationMode>('MENU');
    const [stepIndex, setStepIndex] = useState(0);
    const [context, setContext] = useState<any>({});
    const [inputVal, setInputVal] = useState('');
    const [feedback, setFeedback] = useState<{ type: FeedbackType, message: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus management - Critical for scanner usage
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };
        focusInput();
        const interval = setInterval(focusInput, 2000); // Ensure focus stays
        window.addEventListener('click', focusInput); 
        return () => {
            clearInterval(interval);
            window.removeEventListener('click', focusInput);
        };
    }, [stepIndex, mode, feedback]);

    // Reset
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

    // --- WORKFLOW DEFINITIONS ---

    // 1. PUTAWAY (Armazenagem Inteligente)
    const putawaySteps: WizardStep[] = [
        {
            id: 0,
            title: "Armazenagem",
            prompt: "BIPE O PALLET",
            subText: "Origem: Recebimento",
            icon: <CubeIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-blue-50',
            accentColor: 'text-blue-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et) return { valid: false, message: "Etiqueta não encontrada" };
                if (et.status !== EtiquetaStatus.APONTADA && et.status !== EtiquetaStatus.ARMAZENADA) {
                    return { valid: false, message: `Status incorreto: ${et.status}` };
                }
                
                // IA Logic: Get Suggestion
                const suggestion = getBestPutawayAddress(et);
                // We allow proceeding even without suggestion, but warn
                const target = suggestion?.endereco;
                const reason = suggestion?.reason || "Nenhuma sugestão ideal encontrada";

                return { 
                    valid: true, 
                    nextContext: { etiqueta: et, target, reason },
                    autoAdvance: true
                };
            }
        },
        {
            id: 1,
            title: "Armazenagem",
            prompt: "VÁ PARA O DESTINO",
            subText: (ctx) => ctx.target ? `Sugestão: ${ctx.target.codigo}` : "Escolha uma posição livre",
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-yellow-50',
            accentColor: 'text-yellow-600',
            validate: (input, ctx) => {
                const scannedCode = input.toUpperCase();
                
                const manualAddr = enderecos.find(e => e.codigo === scannedCode);
                if (!manualAddr) return { valid: false, message: "Endereço inválido" };
                if (manualAddr.status !== EnderecoStatus.LIVRE) return { valid: false, message: `Endereço Ocupado (${manualAddr.status})` };

                // Logic execution
                const res = armazenarEtiqueta(ctx.etiqueta.id, manualAddr.id);
                if (!res.success) return { valid: false, message: res.message };

                return { valid: true, message: "ARMAZENADO COM SUCESSO", autoAdvance: true };
            }
        }
    ];

    // 2. MOVIMENTAÇÃO LIVRE
    const moveSteps: WizardStep[] = [
        {
            id: 0,
            title: "Movimentação",
            prompt: "BIPE A ORIGEM",
            subText: "Leia o código do Pallet (LPN)",
            icon: <ArrowsRightLeftIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-indigo-50',
            accentColor: 'text-indigo-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                if (!et) return { valid: false, message: "Pallet não encontrado" };
                if (et.status !== EtiquetaStatus.ARMAZENADA) return { valid: false, message: "Pallet não está armazenado" };
                return { valid: true, nextContext: { etiqueta: et }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Movimentação",
            prompt: "BIPE O DESTINO",
            subText: (ctx) => `LPN: ${ctx.etiqueta.id}`,
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-yellow-50',
            accentColor: 'text-yellow-600',
            validate: (input, ctx) => {
                const addr = enderecos.find(e => e.codigo === input.toUpperCase());
                if (!addr) return { valid: false, message: "Endereço inválido" };
                if (addr.status !== EnderecoStatus.LIVRE) return { valid: false, message: `Ocupado: ${addr.status}` };

                const res = armazenarEtiqueta(ctx.etiqueta.id, addr.id);
                if (!res.success) return { valid: false, message: res.message };

                return { valid: true, message: "MOVIMENTADO COM SUCESSO", autoAdvance: true };
            }
        }
    ];

    // 3. INVENTÁRIO RÁPIDO (Blind Count Simplificado)
    const inventorySteps: WizardStep[] = [
        {
            id: 0,
            title: "Inventário Rápido",
            prompt: "BIPE O ENDEREÇO",
            icon: <MapPinIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-purple-50',
            accentColor: 'text-purple-600',
            validate: (input) => {
                const addr = enderecos.find(e => e.codigo === input.toUpperCase());
                if (!addr) return { valid: false, message: "Endereço inexistente" };
                return { valid: true, nextContext: { endereco: addr }, autoAdvance: true };
            }
        },
        {
            id: 1,
            title: "Inventário Rápido",
            prompt: "BIPE O PRODUTO",
            subText: (ctx) => `Posição: ${ctx.endereco.codigo}`,
            icon: <QrCodeIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-white',
            accentColor: 'text-purple-600',
            validate: (input) => {
                const et = getEtiquetaById(input.toUpperCase());
                const s = skus.find(k => k.sku === input.toUpperCase());
                
                if (et) return { valid: true, nextContext: { itemType: 'LPN', itemId: et.id, skuId: et.skuId }, autoAdvance: true };
                if (s) return { valid: true, nextContext: { itemType: 'SKU', itemId: s.sku, skuId: s.id }, autoAdvance: true };
                
                return { valid: false, message: "Produto não identificado" };
            }
        },
        {
            id: 2,
            title: "Inventário Rápido",
            prompt: "QTD ENCONTRADA",
            subText: "Digite a quantidade física",
            icon: <ClipboardDocumentCheckIcon className="h-20 w-20" />,
            inputType: 'number',
            bgColor: 'bg-green-50',
            accentColor: 'text-green-600',
            validate: (input, ctx) => {
                const qty = parseInt(input);
                if (isNaN(qty) || qty < 0) return { valid: false, message: "Quantidade inválida" };
                
                // Simple Logic: Update pallet if LPN scanned
                if (ctx.itemType === 'LPN') {
                    apontarEtiqueta(ctx.itemId, { quantidadeCaixas: qty });
                }
                
                // FIX: Use 'Conferência' instead of 'Inventário' to match AuditLog entity type.
                logEvent(AuditActionType.UPDATE, 'Conferência', ctx.endereco.id, `Contagem Rápida: ${ctx.itemType} ${ctx.itemId} = ${qty}`);
                
                return { valid: true, message: "CONTAGEM REGISTRADA", autoAdvance: true };
            }
        }
    ];

    // 4. CONSULTA RÁPIDA
    const querySteps: WizardStep[] = [
        {
            id: 0,
            title: "Consulta",
            prompt: "BIPE O CÓDIGO",
            subText: "LPN, Endereço ou SKU",
            icon: <MagnifyingGlassIcon className="h-20 w-20" />,
            inputType: 'text',
            bgColor: 'bg-gray-50',
            accentColor: 'text-gray-600',
            validate: (input) => {
                const val = input.toUpperCase();
                const et = getEtiquetaById(val);
                const end = enderecos.find(e => e.codigo === val);
                const sku = skus.find(s => s.sku === val);

                let msg = "NADA ENCONTRADO";
                if (et) {
                    const s = skus.find(k => k.id === et.skuId);
                    const loc = enderecos.find(e => e.id === et.enderecoId);
                    msg = `LPN: ${et.id}\nSKU: ${s?.sku}\nQtd: ${et.quantidadeCaixas}\nLocal: ${loc?.codigo || 'N/A'}`;
                } else if (end) {
                    const stored = etiquetas.filter(e => e.enderecoId === end.id).length;
                    msg = `Endereço: ${end.codigo}\nStatus: ${end.status}\nPallets: ${stored}`;
                } else if (sku) {
                    msg = `SKU: ${sku.sku}\n${sku.descritivo.substring(0,20)}\nTotal Cx: ${sku.totalCaixas}`;
                }

                return { valid: true, message: msg, autoAdvance: false }; 
            }
        }
    ];

    // --- ENGINE ---

    const getWorkflow = () => {
        switch (mode) {
            case 'PUTAWAY': return putawaySteps;
            case 'MOVIMENTACAO': return moveSteps;
            case 'INVENTARIO': return inventorySteps;
            case 'CONSULTA': return querySteps;
            default: return [];
        }
    };

    const steps = getWorkflow();
    const currentStep = steps[stepIndex];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputVal.trim()) return;

        setFeedback(null);

        const result = currentStep.validate(inputVal.trim(), context);

        if (result.valid) {
            setFeedback({ type: 'success', message: result.message || 'OK' });
            if (navigator.vibrate) navigator.vibrate(50);

            setTimeout(() => {
                if (result.autoAdvance) {
                    if (stepIndex >= steps.length - 1) {
                        // Cycle back to start of same workflow for efficiency
                        setStepIndex(0);
                        setContext({});
                        setFeedback(null);
                        setInputVal('');
                    } else {
                        goToNextStep(result.nextContext);
                    }
                }
            }, result.message && result.message.includes('\n') ? 2500 : 800);
        } else {
            setFeedback({ type: 'error', message: result.message || 'Erro' });
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setInputVal('');
        }
    };

    // --- RENDER ---

    if (mode === 'MENU') {
        const putawayCount = etiquetas.filter(e => e.status === EtiquetaStatus.APONTADA).length;
        
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <div className="bg-white p-4 shadow-sm mb-4">
                    <h1 className="text-xl font-extrabold text-gray-800 text-center">Modo Operador</h1>
                    <p className="text-xs text-gray-500 text-center">Selecione a atividade</p>
                </div>
                <div className="flex-1 px-4 pb-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        <MenuButton 
                            label="Armazenagem" 
                            icon={CubeIcon} 
                            color="text-blue-600" 
                            onClick={() => setMode('PUTAWAY')}
                            badge={putawayCount}
                        />
                        <MenuButton 
                            label="Movimentação" 
                            icon={ArrowsRightLeftIcon} 
                            color="text-indigo-600" 
                            onClick={() => setMode('MOVIMENTACAO')}
                        />
                        <MenuButton 
                            label="Inventário" 
                            icon={ClipboardDocumentCheckIcon} 
                            color="text-purple-600" 
                            onClick={() => setMode('INVENTARIO')}
                        />
                        <MenuButton 
                            label="Consulta" 
                            icon={MagnifyingGlassIcon} 
                            color="text-gray-600" 
                            onClick={() => setMode('CONSULTA')}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const isError = feedback?.type === 'error';
    const isSuccess = feedback?.type === 'success';
    
    let bgClass = currentStep.bgColor;
    if (isError) bgClass = 'bg-red-100';
    if (isSuccess) bgClass = 'bg-green-100';

    return (
        <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${bgClass}`}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white shadow-md z-10">
                <button onClick={reset} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <HomeIcon className="h-6 w-6" />
                </button>
                <h2 className="font-bold text-gray-800 text-lg uppercase tracking-wide">{currentStep.title}</h2>
                <div className="w-8"></div> {/* Spacer for alignment */}
            </div>

            {/* Progress */}
            <div className="flex h-1 bg-gray-200">
                {steps.map((s, i) => (
                    <div key={s.id} className={`flex-1 ${i <= stepIndex ? 'bg-indigo-600' : 'bg-transparent'}`} />
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
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
                        <div className={`p-8 rounded-full bg-white shadow-xl mb-8 ${currentStep.accentColor}`}>
                            {currentStep.icon}
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 uppercase leading-none mb-4 tracking-tight">
                            {currentStep.prompt}
                        </h2>
                        {currentStep.subText && (
                            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xl font-bold text-gray-700">
                                    {typeof currentStep.subText === 'function' ? currentStep.subText(context) : currentStep.subText}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Input */}
            <div className="bg-white p-4 pb-6 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
                    <input
                        ref={inputRef}
                        type={currentStep.inputType}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        className={`w-full h-16 pl-4 pr-16 text-2xl font-bold border-4 rounded-xl focus:outline-none focus:ring-0 transition-all uppercase
                            ${isError ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-300' : 
                              isSuccess ? 'border-green-500 bg-green-50 text-green-900' : 
                              'border-indigo-600 text-gray-900'}`}
                        placeholder=""
                        autoFocus
                        disabled={!!feedback && feedback.type !== 'neutral'} 
                    />
                    <button 
                        type="submit"
                        disabled={!inputVal}
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
