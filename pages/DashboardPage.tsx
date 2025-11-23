
import React, { useMemo } from 'react';
import { CubeIcon, InboxStackIcon, MapIcon, TruckIcon, DocumentChartBarIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useWMS } from '../context/WMSContext';
import { EtiquetaStatus, EnderecoStatus, MissaoTipo } from '../types';

const DashboardPage: React.FC = () => {
    const { etiquetas, enderecos, pedidos, missoes } = useWMS();

    const stats = [
        { name: 'Pallets no Estoque', value: etiquetas.filter(e => e.status === EtiquetaStatus.ARMAZENADA).length, icon: CubeIcon, color: 'bg-blue-500' },
        { name: 'Recebimentos Pendentes', value: etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO).length, icon: InboxStackIcon, color: 'bg-yellow-500' },
        { name: 'Posições Ocupadas', value: `${enderecos.filter(e => e.status === EnderecoStatus.OCUPADO).length} / ${enderecos.length}`, icon: MapIcon, color: 'bg-green-500' },
        { name: 'Pedidos em Aberto', value: pedidos.filter(p => p.status !== 'Expedido').length, icon: TruckIcon, color: 'bg-indigo-500' },
        { name: 'Missões Ativas', value: missoes.filter(m => m.status !== 'Concluída').length, icon: DocumentChartBarIcon, color: 'bg-purple-500' },
        { name: 'Alertas', value: 0, icon: ExclamationTriangleIcon, color: 'bg-red-500' },
    ];

    const tasksByArea = useMemo(() => {
        const pendingMissions = missoes.filter(m => m.status !== 'Concluída');
        const grouped = pendingMissions.reduce((acc, mission) => {
            if (!acc[mission.tipo]) {
                acc[mission.tipo] = 0;
            }
            acc[mission.tipo]++;
            return acc;
        }, {} as Record<MissaoTipo, number>);
        return Object.entries(grouped).sort(([, a], [, b]) => b - a);
    }, [missoes]);


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Operacional</h1>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.name} className="bg-white overflow-hidden shadow-lg rounded-lg transform hover:scale-105 transition-transform duration-300">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                        <dd className="text-3xl font-semibold text-gray-900">{item.value}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Últimas Missões</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {missoes.slice(-5).reverse().map(missao => (
                                    <tr key={missao.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{missao.tipo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enderecos.find(e => e.id === missao.origemId)?.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enderecos.find(e => e.id === missao.destinoId)?.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${missao.status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {missao.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-gray-700"/>
                        Tarefas Pendentes por Área
                    </h2>
                     <div className="space-y-4">
                        {tasksByArea.length > 0 ? tasksByArea.map(([tipo, count]) => {
                            const total = missoes.filter(m => m.status !== 'Concluída').length;
                            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                            return (
                                <div key={tipo}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium text-gray-700">{tipo}</span>
                                        <span className="text-sm font-medium text-gray-700">{count} {count === 1 ? 'missão' : 'missões'}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        }) : (
                             <p className="text-gray-500 text-center mt-8">Nenhuma tarefa pendente no momento.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
