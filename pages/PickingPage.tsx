import React, { useState, useMemo, useEffect } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo, Pedido, SKU, Endereco, Etiqueta } from '../types';
import { ChevronDownIcon, ChevronRightIcon, ClipboardDocumentListIcon, CubeIcon, FlagIcon, InboxIcon, PlayCircleIcon, CheckCircleIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon, LockClosedIcon, CameraIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
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

const DivergenceModal: React.FC<{
    mission: Missao,
    sku: SKU,
    onClose: () => void,
    onConfirm: (missionId: string, reason: string) => void
}> = ({ mission, sku, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    return (
        <Modal title="Reportar Divergência no Picking" onClose={onClose}>
            <div className="space-y-4">
                <p>Você está reportando uma divergência para o item:</p>
                <div className="p-2 bg-yellow-50 border rounded-md">
                    <p className="font-bold">{sku.sku} - {sku.descritivo}</p>
                    <p className="text-sm">Quantidade solicitada: {mission.quantidade} caixas</p>
                </div>
                <p>Ao confirmar, a missão será finalizada com <strong>quantidade 0 (zero)</strong> e uma divergência de "Falta" será registrada.</p>
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Observação (Obrigatório)</label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Ex: Produto não encontrado no endereço."
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                    <button
                        onClick={() => onConfirm(mission.id, reason)}
                        disabled={!reason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-300"
                    >
                        Confirmar Falta
                    </button>
                </div>
            </div>
        </Modal>
    )
}

const RouteSummaryModal: React.FC<{
    missions: Missao[],
    currentIndex: number,
    onClose: () => void,
    onSelectMission: (missionId: string) => void;
}> = ({ missions, currentIndex, onClose, onSelectMission }) => {
     const { skus, enderecos } = useWMS();
     return (
        <Modal title="Resumo da Rota de Separação" onClose={onClose}>
            <p className="text-sm text-gray-500 mb-3">Você pode clicar em um item pendente para alterar a ordem de separação.</p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {missions.map((mission, index) => {
                    const sku = skus.find(s => s.id === mission.skuId);
                    const address = enderecos.find(e => e.id === mission.origemId);
                    const destination = enderecos.find(e => e.id === mission.destinoId);
                    let status: 'Concluído' | 'Em Andamento' | 'Pendente' = 'Pendente';
                    if (mission.status === 'Concluída') status = 'Concluído';
                    if (index === currentIndex) status = 'Em Andamento';

                    const statusClasses = {
                        'Concluído': 'bg-green-100 text-green-800',
                        'Em Andamento': 'bg-blue-100 text-blue-800',
                        'Pendente': 'bg-gray-100 text-gray-800'
                    }[status];

                    const isClickable = status === 'Pendente';
                    
                    return (
                        <div 
                            key={mission.id}
                            onClick={() => { if (isClickable) { onSelectMission(mission.id); onClose(); } }}
                            className={`p-3 bg-white border rounded-md shadow-sm ${isClickable ? 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-300' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                 <p className="font-semibold text-gray-800">{sku?.sku}</p>
                                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusClasses}`}>{status}</span>
                            </div>
                            <p className="text-sm text-gray-600">De: <strong>{address?.codigo}</strong> Para: <strong>{destination?.codigo}</strong></p>
                            <p className="text-sm text-gray-600">{sku?.descritivo}</p>
                            <p className="text-sm text-gray-600">Qtd: <strong>{mission.quantidade} caixas</strong></p>
                        </div>
                    );
                })}
            </div>
        </Modal>
     )
}


const ActivePickingView: React.FC<{
    activeGroup: GroupedTransport;
    etiquetas: Etiqueta[];
    onCompleteMission: (missionId: string, completedQty: number, divergenceReason?: string) => void;
    onFinishGroup: () => void;
    onRevertGroup: (missionIds: string[]) => void;
}> = ({ activeGroup, etiquetas, onCompleteMission, onFinishGroup, onRevertGroup }) => {
    const { skus, enderecos } = useWMS();

    const allMissions = useMemo(() => activeGroup.families.flatMap(f => f.addresses.flatMap(a => a.missions)).sort((a,b) => {
        if (a.status === 'Concluída' && b.status !== 'Concluída') return 1;
        if (a.status !== 'Concluída' && b.status === 'Concluída') return -1;

        const endA = enderecos.find(e => e.id === a.origemId);
        const endB = enderecos.find(e => e.id === b.origemId);
        return (endA?.codigo || '').localeCompare(endB?.codigo || '');
    }), [activeGroup, enderecos]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [step, setStep] = useState<'SCAN_ADDRESS' | 'ENTER_QUANTITY'>('SCAN_ADDRESS');
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [showDivergenceModal, setShowDivergenceModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    useEffect(() => {
        const newCurrentIndex = allMissions.findIndex(m => m.status !== 'Concluída');
        setCurrentIndex(newCurrentIndex === -1 ? allMissions.length : newCurrentIndex);
    }, [allMissions]);

    useEffect(() => {
        setStep('SCAN_ADDRESS');
        setInputValue('');
        setError('');
    }, [currentIndex]);

    const currentMission = allMissions[currentIndex];
    const missionSku = skus.find(s => s.id === currentMission?.skuId);
    const missionAddress = enderecos.find(e => e.id === currentMission?.origemId);
    const missionEtiqueta = etiquetas.find(e => e.id === currentMission?.etiquetaId);

    const handleValidation = () => {
        setError('');
        if (!currentMission) return;

        switch (step) {
            case 'SCAN_ADDRESS':
                if (inputValue.toUpperCase() === String(missionAddress?.codigo).toUpperCase()) {
                    setStep('ENTER_QUANTITY');
                    setInputValue(String(currentMission.quantidade)); 
                } else {
                    setError('Endereço incorreto!');
                }
                break;
            case 'ENTER_QUANTITY':
                const qty = parseInt(inputValue, 10);
                if (!isNaN(qty) && qty >= 0 && qty <= currentMission.quantidade) {
                     if (window.confirm(`Confirmar a coleta de ${qty} caixas do SKU ${missionSku?.sku}?`)) {
                        onCompleteMission(currentMission.id, qty);
                    }
                } else {
                    setError(`Quantidade inválida. Deve ser entre 0 e ${currentMission.quantidade}.`);
                }
                break;
        }
    };
    
    const handleConfirmDivergence = (missionId: string, reason: string) => {
        onCompleteMission(missionId, 0, reason);
        setShowDivergenceModal(false);
    };

    const handleSelectMission = (missionId: string) => {
        const newIndex = allMissions.findIndex(m => m.id === missionId);
        if (newIndex !== -1 && allMissions[newIndex].status !== 'Concluída') {
            setCurrentIndex(newIndex);
        }
    };


    if (!currentMission) {
        return (
             <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Separação Concluída!</h2>
                <p className="text-gray-600 mt-2">Todos os itens para este grupo foram separados.</p>
                <button
                    onClick={onFinishGroup}
                    className="mt-6 flex items-center justify-center mx-auto bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <ArrowUturnLeftIcon className="h-5 w-5 mr-2" /> Voltar para a Lista
                </button>
            </div>
        );
    }

    const StepIndicator: React.FC<{ title: string, current: boolean, done: boolean, value?: string }> = ({ title, current, done, value }) => (
        <div className={`p-3 rounded-lg border-2 ${current ? 'bg-blue-50 border-blue-500' : (done ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200')}`}>
            <h4 className={`text-sm font-bold ${current ? 'text-blue-700' : (done ? 'text-green-700' : 'text-gray-500')}`}>{title}</h4>
            {done && <p className="text-lg font-semibold text-gray-800">{value}</p>}
        </div>
    );
    
    const inputPlaceholder = {
        SCAN_ADDRESS: `Leia o endereço: ${missionAddress?.codigo}`,
        ENTER_QUANTITY: `Confirme a quantidade (esperado: ${currentMission.quantidade})`
    }[step];
    
    const inputType = step === 'ENTER_QUANTITY' ? 'number' : 'text';


    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-indigo-500">
            {showDivergenceModal && missionSku && <DivergenceModal mission={currentMission} sku={missionSku} onClose={() => setShowDivergenceModal(false)} onConfirm={handleConfirmDivergence} />}
            {showSummaryModal && <RouteSummaryModal missions={allMissions} currentIndex={currentIndex} onClose={() => setShowSummaryModal(false)} onSelectMission={handleSelectMission} />}

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Separando Transporte: {activeGroup.pedido.numeroTransporte}</h2>
                    <p className="text-gray-600">Item {currentIndex + 1} de {allMissions.length}</p>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setShowSummaryModal(true)} className="flex items-center text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300">
                        <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-1"/> Ver Resumo da Rota
                    </button>
                    <button
                        onClick={() => onRevertGroup(allMissions.map(m => m.id))}
                        className="flex items-center text-sm bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600 shadow-sm"
                    >
                        <ArrowUturnLeftIcon className="h-4 w-4 mr-1"/> Estornar Missão
                    </button>
                 </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* INSTRUCTION PANEL */}
                <div className="space-y-4">
                    <StepIndicator title="1. ENDEREÇO DE ORIGEM" current={step === 'SCAN_ADDRESS'} done={step !== 'SCAN_ADDRESS'} value={missionAddress?.codigo} />
                    {step !== 'SCAN_ADDRESS' && (
                        <div className="animate-fade-in">
                            <StepIndicator title="2. PRODUTO A COLETAR" current={step === 'ENTER_QUANTITY'} done={false} />
                            {missionSku?.foto && <img src={missionSku.foto} alt={missionSku.descritivo} className="w-full h-32 object-contain my-2 bg-gray-100 rounded"/>}
                            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                                <p className="text-xl font-bold">{missionSku?.descritivo}</p>
                                <p>SKU a coletar: <span className="text-lg font-bold">{missionSku?.sku}</span></p>
                                <p>Quantidade a coletar: <span className="text-2xl font-bold">{currentMission.quantidade}</span> caixas</p>
                                <p>Lote: <span className="font-semibold">{missionEtiqueta?.lote || 'N/A'}</span></p>
                                <p>Validade: <span className="font-semibold">{missionEtiqueta?.validade ? new Date(missionEtiqueta.validade).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</span></p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ACTION PANEL */}
                <div className="p-4 bg-gray-100 rounded-lg flex flex-col justify-center space-y-4">
                     <div>
                        <label htmlFor="validation-input" className="text-center block text-lg font-semibold text-gray-800 mb-2">{inputPlaceholder}</label>
                        <input
                            id="validation-input"
                            type={inputType}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleValidation()}
                            autoFocus
                            className="w-full text-center text-2xl font-mono p-3 border-2 border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {error && <p className="text-red-600 text-center mt-2">{error}</p>}
                    </div>
                    <button onClick={handleValidation} className="w-full bg-green-600 text-white font-bold py-4 rounded-md text-lg hover:bg-green-700">
                        Confirmar
                    </button>
                    <button onClick={() => setShowDivergenceModal(true)} className="w-full flex items-center justify-center text-sm bg-red-100 text-red-700 font-semibold py-2 rounded-md hover:bg-red-200">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" /> Reportar Divergência
                    </button>
                </div>
            </div>
        </div>
    );
};


const AvailablePickingList: React.FC<{
    availableGroups: GroupedTransport[];
    onStartGroup: (pedidoId: string, familia: string) => void;
}> = ({ availableGroups, onStartGroup }) => {
    const [expandedTransport, setExpandedTransport] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Transportes Aguardando Separação</h2>
            {availableGroups.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
                    <InboxIcon className="mx-auto h-12 w-12 text-gray-400"/>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma missão de picking pendente</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aguardando a importação de novos pedidos.
                    </p>
                </div>
            ) : (
                availableGroups.map(group => (
                    <div key={group.pedido.id} className={`bg-white rounded-lg shadow-md ${group.pedido.priority ? 'border-2 border-yellow-400' : ''}`}>
                        <button
                            onClick={() => setExpandedTransport(expandedTransport === group.pedido.id ? null : group.pedido.id)}
                            className="w-full flex justify-between items-center p-4 text-left"
                        >
                            <div className="flex items-center">
                                <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600 mr-3"/>
                                <span className="font-bold text-lg text-gray-800">Transporte: {group.pedido.numeroTransporte}</span>
                                {group.pedido.priority && <span className="ml-3 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">PRIORITÁRIO</span>}
                            </div>
                            {expandedTransport === group.pedido.id ? <ChevronDownIcon className="h-6 w-6"/> : <ChevronRightIcon className="h-6 w-6"/>}
                        </button>
                        
                        {expandedTransport === group.pedido.id && (
                            <div className="p-4 border-t space-y-3">
                                {group.families.map(family => (
                                    <div key={family.familyName} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-700">Família: {family.familyName}</p>
                                            <p className="text-sm text-gray-500">{family.addresses.length} endereços, {family.totalItems} itens</p>
                                        </div>
                                        <button
                                            onClick={() => onStartGroup(group.pedido.id, family.familyName)}
                                            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                                        >
                                           <PlayCircleIcon className="h-5 w-5 mr-2"/> Iniciar Separação
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};


const PickingPage: React.FC = () => {
    const { missoes, pedidos, skus, enderecos, etiquetas, assignFamilyMissionsToOperator, getMyActivePickingGroup, updateMissionStatus, revertMissionGroup } = useWMS();
    const currentUserId = 'admin_user';

    const [myActiveGroup, setMyActiveGroup] = useState<GroupedTransport | null>(null);

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

            const groupedByFamily = transportMissions.reduce((acc, mission) => {
                const sku = skus.find(s => s.id === mission.skuId);
                const family = sku?.familia || 'Sem Família';
                if (!acc[family]) acc[family] = [];
                acc[family].push(mission);
                return acc;
            }, {} as Record<string, Missao[]>);

            const families = Object.entries(groupedByFamily).map(([familyName, familyMissions]) => {
                const groupedByAddress = familyMissions.reduce((acc, mission) => {
                    const addressId = mission.origemId;
                    if (!acc[addressId]) acc[addressId] = [];
                    acc[addressId].push(mission);
                    return acc;
                }, {} as Record<string, Missao[]>);

                const addresses = Object.entries(groupedByAddress)
                    .map(([addressId, addressMissions]) => ({
                        address: enderecos.find(e => e.id === addressId)!,
                        missions: addressMissions,
                    }))
                    .filter(item => item.address)
                    .sort((a, b) => a.address.codigo.localeCompare(b.address.codigo));

                return {
                    familyName,
                    addresses,
                    totalItems: familyMissions.length,
                };
            });

            return { pedido, families };
        }).filter(item => item.pedido)
        .sort((a, b) => {
             if (a.pedido.priority && !b.pedido.priority) return -1;
             if (!a.pedido.priority && b.pedido.priority) return 1;
             return new Date(a.pedido.createdAt).getTime() - new Date(b.pedido.createdAt).getTime();
        });
    };
    
    useEffect(() => {
        const activeMissions = getMyActivePickingGroup(currentUserId);
        if (activeMissions && activeMissions.length > 0) {
            const grouped = groupAndSortMissions(activeMissions);
            setMyActiveGroup(grouped[0] || null);
        } else {
            setMyActiveGroup(null);
        }
    }, [missoes, currentUserId]);


    const availableGroups = useMemo(() => {
        const pendingMissions = missoes.filter(m =>
            (m.tipo === MissaoTipo.PICKING || m.tipo === MissaoTipo.REABASTECIMENTO) && m.status === 'Pendente'
        );
        return groupAndSortMissions(pendingMissions);
    }, [missoes, pedidos, skus, enderecos]);
    
    const handleStartGroup = (pedidoId: string, familia: string) => {
        assignFamilyMissionsToOperator(pedidoId, familia, currentUserId);
    };

    const handleCompleteMission = (missionId: string, completedQty: number, divergenceReason?: string) => {
        updateMissionStatus(missionId, 'Concluída', currentUserId, completedQty, divergenceReason);
    };

    const handleFinishGroup = () => {
        setMyActiveGroup(null);
    };

    const handleRevertGroup = (missionIds: string[]) => {
        if(window.confirm("Tem certeza que deseja estornar este grupo de missões? Elas voltarão para a fila de pendentes.")) {
            revertMissionGroup(missionIds);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Picking (Separação de Pedidos)</h1>
            {myActiveGroup ? (
                <ActivePickingView
                    activeGroup={myActiveGroup}
                    etiquetas={etiquetas}
                    onCompleteMission={handleCompleteMission}
                    onFinishGroup={handleFinishGroup}
                    onRevertGroup={handleRevertGroup}
                />
            ) : (
                <AvailablePickingList
                    availableGroups={availableGroups}
                    onStartGroup={handleStartGroup}
                />
            )}
        </div>
    );
};

export default PickingPage;
