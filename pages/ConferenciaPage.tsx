import React, { useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { MissaoTipo, Pedido, SKU, Missao } from '../types';
import { CheckBadgeIcon, CubeIcon, ListBulletIcon, UserCircleIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline';

interface ConferenceMissionCardProps {
    mission: Missao;
    pedido: Pedido | undefined;
    onStart: (missionId: string) => void;
    onComplete: (missionId: string) => void;
}

const ConferenceMissionCard: React.FC<ConferenceMissionCardProps> = ({ mission, pedido, onStart, onComplete }) => {
    const { users } = useWMS();
    const operador = users.find(u => u.id === mission.operadorId);
    
    if (!pedido) {
        return <div className="bg-red-100 text-red-800 p-4 rounded-lg">Pedido {mission.pedidoId} não encontrado.</div>;
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Conferir Transporte: {pedido.numeroTransporte}</h3>
                    <p className="text-sm text-gray-500 font-mono">Missão ID: {mission.id}</p>
                </div>
                 <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${mission.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {mission.status}
                    </span>
                    {operador && (
                         <p className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                            <UserCircleIcon className="h-4 w-4 mr-1"/> {operador.username}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t">
                 <h4 className="font-semibold text-gray-700 mb-2">Itens para Conferir</h4>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {pedido.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-medium text-gray-900">{item.descricao}</p>
                                <p className="text-sm text-gray-600">SKU: {item.sku} | Lote: {item.lote}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-indigo-600">{item.quantidadeCaixas}</p>
                                <p className="text-xs text-gray-500">caixas</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-end">
                {mission.status === 'Pendente' && (
                    <button onClick={() => onStart(mission.id)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <PlayIcon className="h-5 w-5 mr-2" /> Iniciar Conferência
                    </button>
                )}
                 {mission.status === 'Em Andamento' && (
                    <button onClick={() => onComplete(mission.id)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <CheckCircleIcon className="h-5 w-5 mr-2" /> Finalizar Conferência
                    </button>
                )}
            </div>
        </div>
    );
};

const ConferenciaPage: React.FC = () => {
    const { missoes, pedidos, updateMissionStatus } = useWMS();
    const currentUserId = 'admin_user'; // Mock user

    const conferenceMissions = useMemo(() => {
        return missoes.filter(m => m.tipo === MissaoTipo.CONFERENCIA && m.status !== 'Concluída');
    }, [missoes]);
    
    const myConferenceMission = useMemo(() => {
        return conferenceMissions.find(m => m.operadorId === currentUserId && m.status === 'Em Andamento');
    }, [conferenceMissions, currentUserId]);
    
    const pendingConferenceMissions = useMemo(() => {
        return conferenceMissions.filter(m => m.status === 'Pendente' || m.status === 'Atribuída');
    }, [conferenceMissions]);

    const handleStartConference = (missionId: string) => {
        // In a real multi-user scenario, you'd check if another user took it.
        // For now, just assign and start.
        updateMissionStatus(missionId, 'Em Andamento');
    };

    const handleCompleteConference = (missionId: string) => {
        updateMissionStatus(missionId, 'Concluída');
        const mission = missoes.find(m => m.id === missionId);
        if (mission?.pedidoId) {
            // This would trigger the next step, e.g., Expedição
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Conferência de Pedidos</h1>
            
            <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Minha Conferência Atual</h2>
                 {myConferenceMission ? (
                    <ConferenceMissionCard
                        mission={myConferenceMission}
                        pedido={pedidos.find(p => p.id === myConferenceMission.pedidoId)}
                        onStart={handleStartConference}
                        onComplete={handleCompleteConference}
                    />
                ) : (
                     <div className="text-center py-10 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
                        <CheckBadgeIcon className="mx-auto h-12 w-12 text-gray-400"/>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conferência em andamento</h3>
                        <p className="mt-1 text-sm text-gray-500">
                           Selecione uma conferência pendente para começar.
                        </p>
                    </div>
                )}
            </section>
            
             <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Conferências Pendentes ({pendingConferenceMissions.length})</h2>
                 {pendingConferenceMissions.length > 0 ? (
                    <div className="space-y-4">
                        {pendingConferenceMissions.map(mission => (
                            <ConferenceMissionCard
                                key={mission.id}
                                mission={mission}
                                pedido={pedidos.find(p => p.id === mission.pedidoId)}
                                onStart={handleStartConference}
                                onComplete={handleCompleteConference}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">Nenhum pedido aguardando conferência.</p>
                    </div>
                )}
            </section>

        </div>
    );
};

export default ConferenciaPage;