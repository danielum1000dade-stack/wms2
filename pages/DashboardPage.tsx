
import React, { useMemo } from 'react';
import { CubeIcon, InboxStackIcon, MapIcon, TruckIcon, DocumentChartBarIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useWMS } from '../context/WMSContext';
import { EtiquetaStatus, EnderecoStatus, MissaoTipo } from '../types';

const DashboardPage: React.FC = () => {
    const { etiquetas, enderecos, pedidos, missoes, conferenciaErros } = useWMS();

    // KPIs Principais
    const ocupacao = useMemo(() => {
        const total = enderecos.length;
        const ocupados = enderecos.filter(e => e.status === EnderecoStatus.OCUPADO).length;
        return total > 0 ? Math.round((ocupados / total) * 100) : 0;
    }, [enderecos]);

    const pedidosHoje = useMemo(() => {
        // Simulando "hoje" como todos os pedidos no sistema para este exemplo
        return pedidos.length;
    }, [pedidos]);

    const pedidosExpedidos = useMemo(() => {
        return pedidos.filter(p => p.status === 'Expedido').length;
    }, [pedidos]);
    
    const progressoExpedicao = pedidosHoje > 0 ? Math.round((pedidosExpedidos / pedidosHoje) * 100) : 0;

    const missoesPendentes = useMemo(() => missoes.filter(m => m.status === 'Pendente').length, [missoes]);
    
    const stats = [
        { 
            name: 'Ocupação do Armazém', 
            value: `${ocupacao}%`, 
            subtext: `${enderecos.filter(e => e.status === EnderecoStatus.OCUPADO).length} de ${enderecos.length} posições`,
            icon: MapIcon, 
            color: ocupacao > 90 ? 'bg-red-500' : (ocupacao > 75 ? 'bg-yellow-500' : 'bg-green-500') 
        },
        { 
            name: 'Progresso Expedição', 
            value: `${progressoExpedicao}%`, 
            subtext: `${pedidosExpedidos} de ${pedidosHoje} pedidos`,
            icon: TruckIcon, 
            color: progressoExpedicao === 100 ? 'bg-green-600' : 'bg-blue-600' 
        },
        { 
            name: 'Fila de Missões', 
            value: missoesPendentes, 
            subtext: 'Tarefas aguardando operador',
            icon: ClipboardDocumentListIcon, 
            color: missoesPendentes > 20 ? 'bg-red-500' : 'bg-indigo-500' 
        },
        { 
            name: 'Recebimentos Pendentes', 
            value: etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO).length, 
            subtext: 'Pallets na doca',
            icon: InboxStackIcon, 
            color: 'bg-purple-500' 
        },
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

    const recentErrors = useMemo(() => {
        return conferenciaErros.slice(-5).reverse();
    }, [conferenciaErros]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Cockpit Operacional</h1>
                <p className="text-sm text-gray-500">Atualizado em: {new Date().toLocaleTimeString()}</p>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 ${item.color} rounded-lg p-3 shadow-sm`}>
                                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                        <dd className="text-2xl font-bold text-gray-900">{item.value}</dd>
                                        <dd className="text-xs text-gray-400 mt-1">{item.subtext}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart: Tasks by Area */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <DocumentChartBarIcon className="h-5 w-5 mr-2 text-gray-500"/>
                        Carga de Trabalho por Área
                    </h2>
                    <div className="space-y-6">
                        {tasksByArea.length > 0 ? tasksByArea.map(([tipo, count]) => {
                            const total = missoes.filter(m => m.status !== 'Concluída').length;
                            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                            return (
                                <div key={tipo}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-700">{tipo}</span>
                                        <span className="text-sm font-bold text-gray-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-1000 ${
                                                tipo === MissaoTipo.PICKING ? 'bg-blue-500' : 
                                                tipo === MissaoTipo.REABASTECIMENTO ? 'bg-red-500' : 'bg-gray-500'
                                            }`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        }) : (
                             <p className="text-gray-500 text-center mt-8 bg-gray-50 p-4 rounded-lg">
                                 O armazém está em dia! Nenhuma tarefa pendente.
                             </p>
                        )}
                    </div>
                </div>

                {/* Alerts / Errors */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center text-red-600">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2"/>
                        Últimos Erros de Conferência
                    </h2>
                    <div className="flow-root">
                        <ul role="list" className="-mb-8">
                            {recentErrors.length > 0 ? recentErrors.map((error, errorIdx) => (
                                <li key={error.id}>
                                    <div className="relative pb-8">
                                        {errorIdx !== recentErrors.length - 1 ? (
                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center ring-8 ring-white">
                                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium text-gray-900">{error.tipo}</span> em SKU ...{error.skuId.slice(-4)}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">{error.observacao || 'Sem observação'}</p>
                                                </div>
                                                <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                                    <time dateTime={error.createdAt}>{new Date(error.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )) : (
                                <div className="text-center py-8">
                                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                                    <p className="mt-2 text-sm font-medium text-gray-900">Sem erros recentes</p>
                                    <p className="text-sm text-gray-500">A operação está fluindo bem.</p>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
            
            {/* Recent Activity Table Snippet */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Status das Docas (Recebimento)</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Ao Vivo</span>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(dock => {
                            // Simulação simples de status de doca
                            const status = Math.random() > 0.5 ? 'Livre' : 'Ocupado';
                            return (
                                <div key={dock} className={`border rounded-lg p-4 text-center ${status === 'Livre' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Doca {dock}</p>
                                    <p className={`text-xl font-bold mt-2 ${status === 'Livre' ? 'text-green-700' : 'text-yellow-700'}`}>{status}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
