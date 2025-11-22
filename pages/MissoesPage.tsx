import React, { useMemo, useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo } from '../types';
import { CubeIcon, ArrowRightIcon, FlagIcon, TrashIcon, UserCircleIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const getStatusConfig = (status: Missao['status']) => {
    switch (status) {
        case 'Pendente': return { class: 'bg-gray-100 text-gray-800', text: 'Pendente' };
        case 'Atribuída': return { class: 'bg-yellow-100 text-yellow-800', text: 'Atribuída' };
        case 'Em Andamento': return { class: 'bg-blue-100 text-blue-800', text: 'Em Andamento' };
        case 'Concluída': return { class: 'bg-green-100 text-green-800', text: 'Concluída' };
        default: return { class: 'bg-gray-100 text-gray-800', text: 'Desconhecido' };
    }
}

const MissionCard: React.FC<{
    mission: Missao;
    isMyMission?: boolean;
    onUpdateStatus?: (missionId: string, newStatus: Missao['status']) => void;
    onDelete?: (mission: Missao) => void;
}> = ({ mission, isMyMission = false, onUpdateStatus, onDelete }) => {
    const { skus, enderecos, users } = useWMS();
    
    const sku = skus.find(s => s.id === mission.skuId);
    const origem = enderecos.find(e => e.id === mission.origemId);
    const destino = enderecos.find(e => e.id === mission.destinoId);
    const operador = users.find(u => u.id === mission.operadorId);
    const statusConfig = getStatusConfig(mission.status);

    return (
        <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${isMyMission ? 'border-indigo-500' : 'border-gray-300'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{mission.tipo}</h3>
                    <p className="text-sm text-gray-500 font-mono">ID: {mission.id}</p>
                </div>
                <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.class}`}>
                        {statusConfig.text}
                    </span>
                    {operador && (
                         <p className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                            <UserCircleIcon className="h-4 w-4 mr-1"/> {operador.username}
                        </p>
                    )}
                </div>
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex items-center">
                    <CubeIcon className="h-6 w-6 text-gray-500 mr-3 flex-shrink-0"/>
                    <div>
                        <p className="font-semibold">{sku?.descritivo || 'Produto não encontrado'}</p>
                        <p className="text-sm text-gray-600">SKU: {sku?.sku} | Qtd: {mission.quantidade} caixas</p>
                    </div>
                </div>
                <div className="flex items-center text-sm">
                    <FlagIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0"/>
                    <span>De: <span className="font-semibold">{origem?.nome || 'Origem desconhecida'}</span></span>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-3"/>
                    <FlagIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/>
                    <span>Para: <span className="font-semibold">{destino?.nome || 'Destino desconhecido'}</span></span>
                </div>
            </div>
            {isMyMission && onUpdateStatus && (
                 <div className="mt-4 pt-3 border-t flex justify-end">
                    {mission.status === 'Atribuída' && (
                        <button onClick={() => onUpdateStatus(mission.id, 'Em Andamento')} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                           <PlayIcon className="h-5 w-5 mr-2" /> Iniciar Missão
                        </button>
                    )}
                    {mission.status === 'Em Andamento' && (
                        <button onClick={() => onUpdateStatus(mission.id, 'Concluída')} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                           <CheckCircleIcon className="h-5 w-5 mr-2" /> Finalizar Missão
                        </button>
                    )}
                 </div>
            )}
             {mission.status === 'Pendente' && onDelete && (
                <div className="mt-4 pt-3 border-t flex justify-end">
                    <button
                        onClick={() => onDelete(mission)}
                        className="flex items-center text-sm text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50"
                    >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Excluir Missão
                    </button>
                </div>
             )}
        </div>
    );
};

const MissoesPage: React.FC = () => {
    const { missoes, deleteMission, assignNextMission, updateMissionStatus } = useWMS();
    const [feedback, setFeedback] = useState('');

    const currentUserId = 'admin_user'; 

    const { myCurrentMission, pendingMissions, otherActiveMissions } = useMemo(() => {
        const nonPickingMissions = missoes.filter(m => m.tipo !== MissaoTipo.PICKING);
        
        const myMission = nonPickingMissions.find(m => m.operadorId === currentUserId && (m.status === 'Atribuída' || m.status === 'Em Andamento')) || null;
        const pending = nonPickingMissions.filter(m => m.status === 'Pendente');
        const otherActive = nonPickingMissions.filter(m => m.operadorId !== currentUserId && (m.status === 'Atribuída' || m.status === 'Em Andamento'));
        
        return {
            myCurrentMission: myMission,
            pendingMissions: pending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            otherActiveMissions: otherActive
        };
    }, [missoes, currentUserId]);
    
    const handleAssignNext = () => {
        setFeedback('');
        const assignedMission = assignNextMission(currentUserId);
        if (assignedMission) {
            setFeedback(`Missão ${assignedMission.id} atribuída a você.`);
        } else {
            setFeedback('Nenhuma missão pendente ou você já possui uma missão ativa.');
        }
        setTimeout(() => setFeedback(''), 3000);
    };
    
    const handleUpdateStatus = (missionId: string, newStatus: Missao['status']) => {
        updateMissionStatus(missionId, newStatus);
        if (newStatus === 'Concluída') {
             setFeedback(`Missão ${missionId} concluída! Você está livre para a próxima.`);
             setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleDelete = (mission: Missao) => {
        if (window.confirm(`Tem certeza que deseja excluir esta missão? O pallet ${mission.etiquetaId} voltará a ficar disponível.`)) {
            const result = deleteMission(mission.id);
            if (!result.success) {
                alert(result.message);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Painel de Missões (Movimentação/Ressuprimento)</h1>
                <button 
                    onClick={handleAssignNext} 
                    disabled={!!myCurrentMission}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    <UserCircleIcon className="h-5 w-5 mr-2" /> Pegar Próxima Missão
                </button>
            </div>

            {feedback && <div className="bg-blue-100 text-blue-800 p-3 rounded-md animate-fade-in">{feedback}</div>}

            <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Minha Missão Atual</h2>
                {myCurrentMission ? (
                    <MissionCard 
                        mission={myCurrentMission} 
                        isMyMission={true}
                        onUpdateStatus={handleUpdateStatus} 
                    />
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
                        <CubeIcon className="mx-auto h-12 w-12 text-gray-400"/>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Você está livre</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Clique em "Pegar Próxima Missão" para iniciar uma nova tarefa.
                        </p>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Fila de Missões Pendentes ({pendingMissions.length})</h2>
                {pendingMissions.length > 0 ? (
                    <div className="space-y-4">
                        {pendingMissions.map(mission => (
                            <MissionCard key={mission.id} mission={mission} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">Nenhuma missão aguardando na fila.</p>
                    </div>
                )}
            </section>
            
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">Outras Missões em Andamento ({otherActiveMissions.length})</h2>
                {otherActiveMissions.length > 0 ? (
                    <div className="space-y-4">
                        {otherActiveMissions.map(mission => (
                            <MissionCard key={mission.id} mission={mission} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">Nenhum outro operador em missão.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default MissoesPage;