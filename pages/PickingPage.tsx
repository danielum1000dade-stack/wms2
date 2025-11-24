
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo, Pedido, SKU, Endereco, Etiqueta } from '../types';
import { ChevronRightIcon, ClipboardDocumentListIcon, CubeIcon, CheckCircleIcon, MapPinIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';

type GroupedAddress = {
    address: Endereco;
    missions: Missao[];
}

type GroupedFamily = {
    familyName: string;
    addresses: GroupedAddress[];
    totalItems: number;
}

type GroupedTransport = {
    pedido: Pedido;
    families: GroupedFamily[];
}

const PickingWizard: React.FC<{
    activeGroup: GroupedTransport;
    etiquetas: Etiqueta[];
    onCompleteMission: (missionId: string, completedQty: number, divergenceReason?: string, observation?: string) => void;
    onFinishGroup: () => void;
    onRevertGroup: (missionIds: string[]) => void;
}> = ({ activeGroup, etiquetas, onCompleteMission, onFinishGroup, onRevertGroup }) => {
    const { skus, enderecos } = useWMS();

    const allMissions = useMemo(() => activeGroup.families.flatMap(f => f.addresses.flatMap(a => a.missions)).sort((a,b) => {
        const endA = enderecos.find(e => e.id === a.origemId);
        const endB = enderecos.find(e => e.id === b.origemId);
        // Sort logic: Zone -> Aisle -> Level -> Position
        return (endA?.sequenciaPicking || 0) - (endB?.sequenciaPicking || 0) || (endA?.codigo || '').localeCompare(endB?.codigo || '');
    }), [activeGroup, enderecos]);

    const currentMission = allMissions.find(m => m.status !== 'Concluída'); // Always pick first pending
    
    const missionSku = skus.find(s => s.id === currentMission?.skuId);
    const missionAddress = enderecos.find(e => e.id === currentMission?.origemId);
    const missionEtiqueta = etiquetas.find(e => e.id === currentMission?.etiquetaId);

    // Steps: 0=Travel/Address, 1=ConfirmQty (Skipped Product Scan)
    const [step, setStep] = useState(0); 
    const [inputVal, setInputVal] = useState('');
    const [error, setError] = useState('');
    const [showDivergence, setShowDivergence] = useState(false);
    const [showList, setShowList] = useState(false); // Toggle List View
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset wizard when mission changes
        setStep(0);
        setInputVal('');
        setError('');
    }, [currentMission?.id]);

    useEffect(() => {
        const focusInput = () => inputRef.current?.focus();
        focusInput();
        window.addEventListener('click', focusInput);
        return () => window.removeEventListener('click', focusInput);
    }, [step, showList, showDivergence]);

    if (!currentMission) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-6">
                <CheckCircleIcon className="h-32 w-32 text-green-600 animate-bounce" />
                <h1 className="text-4xl font-bold text-green-800 mt-4 text-center">Picking Finalizado!</h1>
                <p className="text-xl text-gray-600 mt-2">Bom trabalho.</p>
                <button onClick={onFinishGroup} className="mt-8 w-full py-6 bg-green-600 text-white text-2xl font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
                    Voltar ao Menu
                </button>
            </div>
        );
    }

    const handleInput = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const val = inputVal.trim().toUpperCase();

        if (step === 0) { // Scan Address
            if (val === missionAddress?.codigo.toUpperCase()) {
                setStep(1); // Go straight to Qty (Skip Product Scan)
                setInputVal('');
                if (navigator.vibrate) navigator.vibrate(50);
            } else {
                setError('Endereço Incorreto!');
                setInputVal('');
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        } else if (step === 1) { // Qty
            const qty = parseInt(val);
            if (qty === currentMission.quantidade) {
                onCompleteMission(currentMission.id, qty);
                if (navigator.vibrate) navigator.vibrate(50);
            } else if (qty < currentMission.quantidade && qty >= 0) {
                if (window.confirm(`Quantidade menor (${qty}) que a solicitada (${currentMission.quantidade}). Confirmar falta?`)) {
                     onCompleteMission(currentMission.id, qty, "Falta reportada no picking");
                }
            } else {
                setError('Quantidade Inválida!');
                setInputVal('');
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        }
    };

    // Determine UI State based on Step
    let promptText = "";
    let mainIcon = null;
    let mainValue = "";
    let subValue = "";
    let bgColor = "bg-white";

    if (step === 0) {
        promptText = "VÁ PARA O ENDEREÇO";
        mainIcon = <MapPinIcon className="h-16 w-16 text-blue-600" />;
        mainValue = missionAddress?.codigo || "N/A";
        subValue = `Rua ${missionAddress?.codigo.split('-')[0]} | Nível ${missionAddress?.codigo.split('-')[2]}`;
        bgColor = "bg-blue-50";
    } else {
        promptText = "CONFIRA A QUANTIDADE";
        mainIcon = <ClipboardDocumentListIcon className="h-16 w-16 text-green-600" />;
        mainValue = `${currentMission.quantidade} CX`;
        subValue = missionSku?.descritivo || "Produto";
        bgColor = "bg-green-50";
    }

    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${bgColor}`}>
            {/* Header */}
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-10">
                <div className="text-lg font-bold">Onda: {activeGroup.pedido.numeroTransporte}</div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowList(true)} className="bg-gray-700 p-2 rounded-full hover:bg-gray-600 flex items-center px-3">
                        <ListBulletIcon className="h-5 w-5 text-white mr-2" />
                        <span className="text-xs font-bold">LISTA</span>
                    </button>
                    <div className="text-sm bg-gray-700 px-3 py-1 rounded-full font-mono">
                        {allMissions.filter(m => m.status === 'Concluída').length + 1} / {allMissions.length}
                    </div>
                </div>
            </div>

            {/* Main Display */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 overflow-y-auto">
                <div className="uppercase tracking-widest text-gray-500 font-bold">{promptText}</div>
                
                <div className="bg-white p-6 rounded-3xl shadow-xl w-full border-4 border-transparent transition-all">
                    <div className="flex justify-center mb-4">{mainIcon}</div>
                    <div className="text-5xl font-black text-gray-900 mb-2 break-words">{mainValue}</div>
                    <div className="text-xl text-gray-600 font-medium truncate px-2">{subValue}</div>
                    
                    {/* Product Info ALWAYS visible now since we removed scan step */}
                    <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4 text-left bg-gray-50 p-4 rounded-xl">
                        <div className="col-span-2 text-center border-b pb-2 mb-2">
                            <span className="text-xs text-gray-400 block uppercase">Produto</span>
                            <span className="font-bold text-lg text-indigo-700">{missionSku?.sku}</span>
                            <p className="text-sm text-gray-600 leading-tight mt-1">{missionSku?.descritivo}</p>
                        </div>
                        <div className="text-center border-r border-gray-200">
                            <span className="text-xs text-gray-400 block">Lote</span>
                            <span className="font-bold text-gray-800">{missionEtiqueta?.lote}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-xs text-gray-400 block">Validade</span>
                            <span className="font-bold text-gray-800">{missionEtiqueta?.validade ? new Date(missionEtiqueta.validade).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className="bg-white p-4 border-t-2 border-gray-200 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
                <form onSubmit={handleInput} className="relative">
                    <input 
                        ref={inputRef}
                        type={step === 1 ? "number" : "text"}
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        className={`w-full h-20 pl-6 pr-24 text-3xl border-4 rounded-2xl focus:outline-none focus:ring-0 font-bold uppercase
                            ${error ? 'border-red-500 text-red-900 bg-red-50 placeholder-red-300' : 'border-gray-300 focus:border-indigo-600'}`}
                        placeholder={step === 0 ? "Bipe o Endereço" : "Digite a Qtd"}
                        autoFocus
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl font-bold text-xl uppercase shadow-md active:scale-95 transition-transform">
                        OK
                    </button>
                </form>
                
                {error && (
                    <div className="absolute bottom-24 left-4 right-4 p-4 bg-red-600 text-white font-bold text-center rounded-xl animate-pulse shadow-lg z-20">
                        {error}
                    </div>
                )}

                <div className="mt-4 flex justify-between">
                    <button onClick={() => setShowDivergence(true)} className="text-red-600 text-sm font-bold py-2 px-4 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100">
                        PROBLEMA?
                    </button>
                    <button onClick={() => onRevertGroup(allMissions.map(m => m.id))} className="text-gray-500 text-sm font-medium py-2 px-4">
                        Pausar
                    </button>
                </div>
            </div>

            {/* Modal Lista de Itens */}
            {showList && (
                <Modal title="Itens da Onda" onClose={() => setShowList(false)}>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {allMissions.map((m, idx) => {
                            const sku = skus.find(s => s.id === m.skuId);
                            const addr = enderecos.find(e => e.id === m.origemId);
                            const isCurrent = m.id === currentMission?.id;
                            const isDone = m.status === 'Concluída';
                            
                            return (
                                <div key={m.id} className={`p-3 rounded-lg border flex justify-between items-center ${isCurrent ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : isDone ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white'}`}>
                                    <div>
                                        <p className="font-bold text-sm">{addr?.codigo}</p>
                                        <p className="text-xs text-gray-600">{sku?.sku} - {sku?.descritivo.substring(0,20)}...</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{m.quantidade} cx</p>
                                        {isDone && <CheckCircleIcon className="h-5 w-5 text-green-600 inline ml-1" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-2 border-t text-center">
                        <button onClick={() => setShowList(false)} className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold">Voltar</button>
                    </div>
                </Modal>
            )}

            {showDivergence && (
                <Modal title="Reportar Problema" onClose={() => setShowDivergence(false)}>
                    <div className="space-y-3">
                        <button onClick={() => { onCompleteMission(currentMission.id, 0, "Produto Não Encontrado"); setShowDivergence(false); }} className="w-full p-4 bg-red-100 text-red-800 font-bold rounded-lg text-left hover:bg-red-200">
                            Endereço Vazio
                        </button>
                        <button onClick={() => { onCompleteMission(currentMission.id, 0, "Avaria Total"); setShowDivergence(false); }} className="w-full p-4 bg-orange-100 text-orange-800 font-bold rounded-lg text-left hover:bg-orange-200">
                            Produto Avariado
                        </button>
                        <button onClick={() => { onCompleteMission(currentMission.id, 0, "Endereço Inacessível"); setShowDivergence(false); }} className="w-full p-4 bg-yellow-100 text-yellow-800 font-bold rounded-lg text-left hover:bg-yellow-200">
                            Corredor Bloqueado
                        </button>
                        <button onClick={() => setShowDivergence(false)} className="w-full p-3 bg-gray-200 text-gray-800 font-bold rounded-lg text-center mt-4">
                            Cancelar
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

const PickingPage: React.FC = () => {
    const { missoes, pedidos, skus, enderecos, etiquetas, assignFamilyMissionsToOperator, updateMissionStatus, revertMissionGroup } = useWMS();
    const currentUserId = 'admin_user';

    const [activePedidoId, setActivePedidoId] = useState<string | null>(null);

    // Auto-resume logic
    useEffect(() => {
        if (!activePedidoId) {
            const missionInProgress = missoes.find(m => 
                m.operadorId === currentUserId && 
                (m.status === 'Atribuída' || m.status === 'Em Andamento')
            );
            if (missionInProgress?.pedidoId) {
                setActivePedidoId(missionInProgress.pedidoId);
            }
        }
    }, [missoes, activePedidoId, currentUserId]);
    
    // Grouping Logic
    const groupAndSortMissions = (missionList: Missao[]): GroupedTransport[] => {
         const groupedByTransport = missionList.reduce((acc, mission) => {
            const pedidoId = mission.pedidoId;
            if (!pedidoId) return acc;
            if (!acc[pedidoId]) acc[pedidoId] = [];
            acc[pedidoId].push(mission);
            return acc;
        }, {} as Record<string, Missao[]>);

        return Object.entries(groupedByTransport).map(([pedidoId, transportMissions]) => {
            const pedido = pedidos.find(p => p.id === pedidoId)!;
            if (!pedido) return null;

            const groupedByFamily = transportMissions.reduce((acc, mission) => {
                const sku = skus.find(s => s.id === mission.skuId);
                const family = sku?.familia || 'Geral';
                if (!acc[family]) acc[family] = [];
                acc[family].push(mission);
                return acc;
            }, {} as Record<string, Missao[]>);

            const families = Object.entries(groupedByFamily).map(([familyName, familyMissions]) => {
                const addresses = Object.values(familyMissions.reduce((acc, mission) => {
                    const addr = enderecos.find(e => e.id === mission.origemId);
                    if(addr) {
                        if(!acc[addr.id]) acc[addr.id] = { address: addr, missions: [] };
                        acc[addr.id].missions.push(mission);
                    }
                    return acc;
                }, {} as Record<string, GroupedAddress>));
                return { familyName, addresses, totalItems: familyMissions.length };
            });
            return { pedido, families };
        }).filter((g): g is GroupedTransport => g !== null);
    };

    const myActiveGroup = useMemo(() => {
        if (!activePedidoId) return null;
        const missions = missoes.filter(m => m.pedidoId === activePedidoId && m.operadorId === currentUserId);
        const relevantMissions = missions.filter(m => m.status === 'Atribuída' || m.status === 'Em Andamento' || m.status === 'Concluída');
        
        if(relevantMissions.length === 0 || relevantMissions.every(m => m.status === 'Concluída')) return null;
        
        const groups = groupAndSortMissions(relevantMissions);
        return groups[0] || null;
    }, [activePedidoId, missoes]);

    const availableGroups = useMemo(() => {
        const pending = missoes.filter(m => m.status === 'Pendente' && m.tipo === MissaoTipo.PICKING);
        return groupAndSortMissions(pending);
    }, [missoes]);

    if (myActiveGroup) {
        return <PickingWizard 
            activeGroup={myActiveGroup} 
            etiquetas={etiquetas} 
            onCompleteMission={(id, qty, reason) => updateMissionStatus(id, 'Concluída', currentUserId, qty, reason)}
            onFinishGroup={() => setActivePedidoId(null)}
            onRevertGroup={(ids) => { revertMissionGroup(ids); setActivePedidoId(null); }}
        />
    }

    return (
        <div className="p-4 bg-gray-50 min-h-screen space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Picking - Ondas Disponíveis</h1>
            
            {availableGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-gray-500 bg-white rounded-xl shadow">
                    <CubeIcon className="h-16 w-16 mb-4 text-gray-300"/>
                    <p className="text-lg font-medium">Tudo limpo!</p>
                    <p className="text-sm">Nenhuma missão de picking pendente.</p>
                </div>
            ) : (
                availableGroups.map(group => (
                    <div key={group.pedido.id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-8 border-indigo-500 transition-all hover:shadow-lg">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                    <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-indigo-600"/>
                                    {group.pedido.numeroTransporte}
                                </h2>
                                <p className="text-sm text-gray-500 ml-8">{group.pedido.items.length} SKUs diferentes</p>
                            </div>
                            {group.pedido.priority && <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm animate-pulse">Prioridade</span>}
                        </div>
                        <div className="p-4 space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tarefas por Zona</p>
                            {group.families.map(f => (
                                <button 
                                    key={f.familyName}
                                    onClick={() => { 
                                        const res = assignFamilyMissionsToOperator(group.pedido.id, f.familyName, currentUserId);
                                        if(res.success) setActivePedidoId(group.pedido.id);
                                    }}
                                    className="w-full flex justify-between items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                >
                                    <div className="flex items-center">
                                        <span className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {f.familyName.charAt(0)}
                                        </span>
                                        <div className="text-left">
                                            <span className="block font-bold text-gray-800 group-hover:text-indigo-700">{f.familyName}</span>
                                            <span className="text-xs text-gray-500">{f.addresses.length} posições</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm font-bold mr-2 group-hover:bg-white">
                                            {f.totalItems} cx
                                        </span>
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500"/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default PickingPage;
