
import React, { useState, useMemo, useEffect } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo, Pedido, SKU, Endereco } from '../types';
import { ChevronDownIcon, ChevronRightIcon, ClipboardDocumentListIcon, CubeIcon, FlagIcon, InboxIcon, PlayCircleIcon, CheckCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

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

// Componente para a visualização principal quando o operador tem uma missão ativa
const ActivePickingView: React.FC<{
    activeGroup: GroupedTransport;
    onCompleteMission: (missionId: string) => void;
    onFinishGroup: () => void;
}> = ({ activeGroup, onCompleteMission, onFinishGroup }) => {
    
    const activeMissions = useMemo(() =>
        activeGroup.families.flatMap(f => f.addresses.flatMap(a => a.missions))
        .filter(m => m.status !== 'Concluída'), [activeGroup]);
    
    const [currentStep, setCurrentStep] = useState(0);
    // FIX: Destructured `etiquetas` from the `useWMS` hook to resolve 'Cannot find name' error.
    const { skus, enderecos, etiquetas } = useWMS();

    if (activeMissions.length === 0) {
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
    
    const currentAddress = activeMissions[currentStep].origemId;
    const missionsForCurrentAddress = activeMissions.filter(m => m.origemId === currentAddress);
    const addressInfo = enderecos.find(e => e.id === currentAddress);

    const handleConfirmPick = (missionId: string) => {
        onCompleteMission(missionId);
        // O progresso será gerenciado pelo re-render do useMemo
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-indigo-500">
            <h2 className="text-2xl font-bold text-gray-800">Separando Transporte: {activeGroup.pedido.numeroTransporte}</h2>
            <p className="text-gray-600">Família: <span className="font-semibold">{activeGroup.families[0].familyName}</span></p>

            <div className="mt-6 p-4 bg-gray-100 rounded-lg animate-fade-in">
                <p className="text-lg font-semibold text-gray-700">Próximo Endereço:</p>
                <div className="flex items-center my-2">
                    <FlagIcon className="h-10 w-10 text-indigo-500 mr-4"/>
                    <span className="text-5xl font-bold text-indigo-600">{addressInfo?.nome}</span>
                </div>
            </div>
            
            <div className="mt-4 space-y-3">
                <h3 className="font-semibold">Itens para coletar:</h3>
                {missionsForCurrentAddress.map(mission => {
                    const sku = skus.find(s => s.id === mission.skuId);
                    return (
                        <div key={mission.id} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-900">{sku?.descritivo}</p>
                                <p className="text-sm text-gray-600">SKU: {sku?.sku} | Lote: {etiquetas.find(e => e.id === mission.etiquetaId)?.lote}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-indigo-700">{mission.quantidade} <span className="text-base font-normal">caixas</span></p>
                                <button
                                    onClick={() => handleConfirmPick(mission.id)}
                                    className="mt-1 flex items-center text-sm bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                                >
                                    <CheckCircleIcon className="h-4 w-4 mr-1"/> Confirmar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// Componente para a lista de missões disponíveis
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
                    <div key={group.pedido.id} className="bg-white rounded-lg shadow-md">
                        <button
                            onClick={() => setExpandedTransport(expandedTransport === group.pedido.id ? null : group.pedido.id)}
                            className="w-full flex justify-between items-center p-4 text-left"
                        >
                            <div className="flex items-center">
                                <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600 mr-3"/>
                                <span className="font-bold text-lg text-gray-800">Transporte: {group.pedido.numeroTransporte}</span>
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
    const { missoes, pedidos, skus, enderecos, assignFamilyMissionsToOperator, getMyActivePickingGroup, updateMissionStatus } = useWMS();
    const currentUserId = 'admin_user'; // Mockup de usuário logado

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
        }).filter(item => item.pedido); // Garante que o pedido foi encontrado
    };
    
    // Recalcula grupos disponíveis e meu grupo ativo quando as missões mudam
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
            m.tipo === MissaoTipo.PICKING && m.status === 'Pendente'
        );
        return groupAndSortMissions(pendingMissions);
    }, [missoes, pedidos, skus, enderecos]);
    
    const handleStartGroup = (pedidoId: string, familia: string) => {
        assignFamilyMissionsToOperator(pedidoId, familia, currentUserId);
        // O useEffect vai cuidar de atualizar myActiveGroup
    };

    const handleCompleteMission = (missionId: string) => {
        updateMissionStatus(missionId, 'Concluída');
    };

    const handleFinishGroup = () => {
        setMyActiveGroup(null); // Volta para a tela de seleção
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Picking (Separação de Pedidos)</h1>
            {myActiveGroup ? (
                <ActivePickingView
                    activeGroup={myActiveGroup}
                    onCompleteMission={handleCompleteMission}
                    onFinishGroup={handleFinishGroup}
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