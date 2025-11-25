
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao, MissaoTipo } from '../types';
import { ClipboardDocumentListIcon, CubeIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const PickingPage: React.FC = () => {
    const { missoes, pedidos, skus, enderecos } = useWMS();

    const pickingGroups = useMemo(() => {
        const pickingMissions = missoes.filter(m => m.tipo === MissaoTipo.PICKING);
        
        const grouped = pickingMissions.reduce<Record<string, { missions: Missao[], status: string }>>((acc, m) => {
            const pedidoId = m.pedidoId || 'SEM_PEDIDO';
            if (!acc[pedidoId]) acc[pedidoId] = { missions: [], status: 'Pendente' };
            acc[pedidoId].missions.push(m);
            return acc;
        }, {});

        return Object.entries(grouped).map(([pid, group]) => {
            const pedido = pedidos.find(p => p.id === pid);
            const total = group.missions.length;
            const completed = group.missions.filter(m => m.status === 'Concluída').length;
            
            // Status Derivation
            let status = 'Pendente';
            if (completed === total) status = 'Concluído';
            else if (completed > 0 || group.missions.some(m => m.status === 'Em Andamento')) status = 'Em Andamento';

            return {
                pedidoId: pid,
                numeroTransporte: pedido?.numeroTransporte || 'N/A',
                totalMissions: total,
                completedMissions: completed,
                progress: Math.round((completed / total) * 100),
                status,
                priority: pedido?.priority
            };
        }).sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
    }, [missoes, pedidos]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gestão de Ondas de Picking</h1>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
                    Visão Supervisor
                </div>
            </div>

            {pickingGroups.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow border-dashed border-2 border-gray-300">
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma onda ativa</h3>
                    <p className="mt-1 text-sm text-gray-500">As missões de picking aparecerão aqui quando geradas.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pickingGroups.map(group => (
                        <div key={group.pedidoId} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                        <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-indigo-600"/>
                                        {group.numeroTransporte}
                                    </h3>
                                    <p className="text-xs text-gray-500">ID: {group.pedidoId}</p>
                                </div>
                                {group.priority && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">PRIORIDADE</span>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progresso</span>
                                    <span className="font-bold">{group.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${group.progress}%` }}></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>{group.completedMissions} / {group.totalMissions} Itens</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    group.status === 'Concluído' ? 'bg-green-100 text-green-800' : 
                                    group.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'
                                }`}>{group.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PickingPage;
