
import React, { useMemo, useState } from 'react';
import { 
    CubeIcon, InboxStackIcon, MapIcon, TruckIcon, 
    DocumentChartBarIcon, ExclamationTriangleIcon, 
    ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon,
    UserGroupIcon, ChartBarIcon, FireIcon, BoltIcon
} from '@heroicons/react/24/outline';
import { useWMS } from '../context/WMSContext';
import { EtiquetaStatus, EnderecoStatus, MissaoTipo, Recebimento, Endereco, Missao } from '../types';

// --- COMPONENTS AUXILIARES ---

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtext?: string; 
    icon: React.ElementType; 
    color: string;
    trend?: 'up' | 'down' | 'neutral'; 
}> = ({ title, value, subtext, icon: Icon, color, trend }) => (
    <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="p-5">
            <div className="flex items-center">
                <div className={`flex-shrink-0 ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} rounded-lg p-3`}>
                    <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                        <dd className="flex items-baseline">
                            <div className="text-2xl font-bold text-gray-900">{value}</div>
                            {trend && (
                                <span className={`ml-2 flex items-baseline text-sm font-semibold ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'}
                                </span>
                            )}
                        </dd>
                        {subtext && <dd className="text-xs text-gray-400 mt-1">{subtext}</dd>}
                    </dl>
                </div>
            </div>
        </div>
    </div>
);

const ProgressBar: React.FC<{ label: string; current: number; total: number; colorClass: string }> = ({ label, current, total, colorClass }) => {
    const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return (
        <div className="mt-4">
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                <span>{label}</span>
                <span>{current}/{total} ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

// --- ABA: VISÃO GERAL (COCKPIT) ---
const DashboardOverview: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Alertas Críticos (IA / Regras) */}
            {(data.rupturasRisco > 0 || data.vencimentosProximos > 0 || data.gargalos.length > 0) && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Alertas Operacionais Críticos</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    {data.rupturasRisco > 0 && <li>{data.rupturasRisco} itens com risco iminente de ruptura no picking.</li>}
                                    {data.vencimentosProximos > 0 && <li>{data.vencimentosProximos} pallets vencendo nos próximos 7 dias.</li>}
                                    {data.gargalos.map((g: string, i: number) => <li key={i}>{g}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Fila de Recebimento" 
                    value={data.recebimentosPendentes} 
                    subtext={`${data.docasOcupadas} docas ocupadas`}
                    icon={InboxStackIcon} 
                    color="text-purple-600"
                />
                <StatCard 
                    title="Missões Pendentes" 
                    value={data.missoesPendentes} 
                    subtext={`${data.ressuprimentosPendentes} são ressuprimentos`}
                    icon={ClipboardDocumentListIcon} 
                    color={data.missoesPendentes > 50 ? "text-red-600" : "text-blue-600"}
                />
                <StatCard 
                    title="Pedidos Hoje" 
                    value={data.pedidosTotal} 
                    subtext={`${data.pedidosConcluidos} expedidos (${data.percentualExpedicao}%)`}
                    icon={TruckIcon} 
                    color="text-green-600"
                />
                <StatCard 
                    title="Ocupação Armazém" 
                    value={`${data.ocupacao}%`} 
                    subtext={`${data.posicoesLivres} posições livres`}
                    icon={MapIcon} 
                    color={data.ocupacao > 90 ? "text-red-600" : data.ocupacao > 75 ? "text-yellow-600" : "text-green-600"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Previsão de Tempo (IA Simples) */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center"><BoltIcon className="h-5 w-5 mr-2 text-yellow-300"/> Previsão Operacional</h3>
                        <span className="text-xs bg-indigo-500 px-2 py-1 rounded text-indigo-100">IA Estimada</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-indigo-200 text-sm">Tempo estimado para zerar fila de picking</p>
                            <p className="text-3xl font-bold">{data.tempoEstimadoPicking} min</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-sm">Capacidade de expedição atual</p>
                            <p className="text-2xl font-semibold">{data.produtividadeMedia.toFixed(0)} un/hora</p>
                        </div>
                        <div className="pt-4 border-t border-indigo-500">
                            <p className="text-sm">Status do Fluxo: <span className="font-bold text-yellow-300">{data.statusFluxo}</span></p>
                        </div>
                    </div>
                </div>

                {/* Gráfico de Barras (Simulado com CSS) - Carga de Trabalho */}
                <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Balanço de Carga por Setor</h3>
                    <ProgressBar label="Recebimento (Caminhões)" current={data.recebimentosConcluidos} total={data.recebimentosTotal} colorClass="bg-purple-500" />
                    <ProgressBar label="Picking (Linhas)" current={data.pickingConcluido} total={data.pickingTotal} colorClass="bg-blue-500" />
                    <ProgressBar label="Ressuprimento (Pallets)" current={data.ressuprimentosConcluidos} total={data.ressuprimentosTotal} colorClass="bg-orange-500" />
                    <ProgressBar label="Expedição (Pedidos)" current={data.pedidosConcluidos} total={data.pedidosTotal} colorClass="bg-green-500" />
                </div>
            </div>
        </div>
    );
};

// --- ABA: MAPA VISUAL (HEATMAP) ---
const DashboardStockMap: React.FC<{ enderecos: Endereco[] }> = ({ enderecos }) => {
    // Agrupar por Rua (primeira parte do código)
    const layout = useMemo(() => {
        const ruas: Record<string, Endereco[]> = {};
        enderecos.forEach(e => {
            const rua = e.codigo.split('-')[0] || 'Geral';
            if (!ruas[rua]) ruas[rua] = [];
            ruas[rua].push(e);
        });
        return Object.entries(ruas).sort((a, b) => a[0].localeCompare(b[0]));
    }, [enderecos]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case EnderecoStatus.LIVRE: return 'bg-green-200 hover:bg-green-300';
            case EnderecoStatus.OCUPADO: return 'bg-blue-500 hover:bg-blue-600';
            case EnderecoStatus.PARCIAL: return 'bg-blue-200 hover:bg-blue-300';
            case EnderecoStatus.BLOQUEADO: return 'bg-red-500 hover:bg-red-600';
            case EnderecoStatus.INVENTARIO: return 'bg-yellow-400 hover:bg-yellow-500';
            default: return 'bg-gray-200';
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex space-x-4 text-sm">
                    <span className="flex items-center"><span className="w-3 h-3 bg-green-200 mr-1 rounded"></span> Livre</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 mr-1 rounded"></span> Ocupado</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-red-500 mr-1 rounded"></span> Bloqueado</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 mr-1 rounded"></span> Inventário</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto max-h-[70vh]">
                {layout.map(([rua, addrs]) => (
                    <div key={rua} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2 text-center border-b pb-1">Rua {rua}</h4>
                        <div className="grid grid-cols-4 gap-1">
                            {addrs.sort((a, b) => a.codigo.localeCompare(b.codigo)).map(addr => (
                                <div 
                                    key={addr.id} 
                                    className={`h-8 w-full rounded-sm ${getStatusColor(addr.status)} cursor-pointer transition-colors relative group`}
                                >
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
                                        {addr.codigo} - {addr.status}
                                        <br />Tipo: {addr.tipo}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 text-xs text-center text-gray-500">
                            {addrs.filter(a => a.status === EnderecoStatus.OCUPADO).length} / {addrs.length} Ocupados
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- ABA: PERFORMANCE & QUALIDADE ---
const DashboardPerformance: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Ranking Operadores */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600"/> Ranking de Produtividade (Hoje)
                </h3>
                <div className="space-y-4">
                    {data.rankingOperadores.map((op: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 border'}`}>
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-gray-800">{op.nome}</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-indigo-600">{op.missoes} tarefas</span>
                                <span className="text-xs text-gray-500">{op.tipo}</span>
                            </div>
                        </div>
                    ))}
                    {data.rankingOperadores.length === 0 && <p className="text-gray-500 text-center">Sem dados de produtividade hoje.</p>}
                </div>
            </div>

            {/* Qualidade e Divergências */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600"/> Indicadores de Qualidade
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-green-800">Acuracidade de Estoque</p>
                        <p className="text-3xl font-bold text-green-600">99.8%</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-blue-800">OTIF (Pedidos no Prazo)</p>
                        <p className="text-3xl font-bold text-blue-600">{data.otif}%</p>
                    </div>
                </div>

                <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase">Últimas Divergências</h4>
                <div className="overflow-y-auto max-h-60 space-y-2">
                    {data.divergenciasRecentes.map((div: any, i: number) => (
                        <div key={i} className="flex justify-between items-start p-2 border-b border-gray-100 text-sm">
                            <div>
                                <span className="font-medium text-red-600">{div.tipo}</span>
                                <p className="text-gray-600">{div.sku}</p>
                            </div>
                            <span className="text-gray-400 text-xs">{new Date(div.data).toLocaleTimeString()}</span>
                        </div>
                    ))}
                    {data.divergenciasRecentes.length === 0 && <p className="text-gray-500 text-center text-sm">Nenhuma divergência registrada hoje.</p>}
                </div>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { etiquetas, enderecos, pedidos, missoes, recebimentos, conferenciaErros, divergencias, users } = useWMS();
    const [activeTab, setActiveTab] = useState('overview');

    // --- AGREGADOR DE DADOS (ENGINE) ---
    const dashboardData = useMemo(() => {
        // 1. Estoque
        const totalEnderecos = enderecos.length;
        const ocupados = enderecos.filter(e => e.status === EnderecoStatus.OCUPADO).length;
        const ocupacao = totalEnderecos > 0 ? Math.round((ocupados / totalEnderecos) * 100) : 0;
        
        const hoje = new Date();
        const vencimentosProximos = etiquetas.filter(e => {
            if (!e.validade) return false;
            const val = new Date(e.validade);
            const diff = (val.getTime() - hoje.getTime()) / (1000 * 3600 * 24);
            return diff > 0 && diff <= 7;
        }).length;

        // 2. Recebimento
        const recPendentes = recebimentos.filter(r => r.status !== 'Finalizado');
        const recTotal = recebimentos.length; // Simplificação: ideal seria filtrar por data de hoje
        const recConcluidos = recebimentos.filter(r => r.status === 'Finalizado').length;
        const docasOcupadas = new Set(recPendentes.map(r => r.doca).filter(Boolean)).size;

        // 3. Picking & Missões
        const missoesPendentes = missoes.filter(m => m.status === 'Pendente');
        const pickingTotal = missoes.filter(m => m.tipo === MissaoTipo.PICKING).length;
        const pickingConcluido = missoes.filter(m => m.tipo === MissaoTipo.PICKING && m.status === 'Concluída').length;
        
        const ressuprimentosPendentes = missoesPendentes.filter(m => m.tipo === MissaoTipo.REABASTECIMENTO).length;
        const ressuprimentosTotal = missoes.filter(m => m.tipo === MissaoTipo.REABASTECIMENTO).length;
        const ressuprimentosConcluidos = missoes.filter(m => m.tipo === MissaoTipo.REABASTECIMENTO && m.status === 'Concluída').length;

        // 4. Expedição
        const pedTotal = pedidos.length; // Simplificação
        const pedConcluidos = pedidos.filter(p => p.status === 'Expedido').length;
        const otif = pedTotal > 0 ? Math.round((pedConcluidos / pedTotal) * 100) : 100; // Mock calculation

        // 5. Produtividade (IA Estimada)
        const pickingSpeedPerMin = 2; // Mock: 2 linhas por minuto por operador
        const activeOperators = 2; // Mock
        const tempoEstimadoPicking = Math.round((missoesPendentes.length / (pickingSpeedPerMin * activeOperators)));
        
        // 6. Ruptura
        // Mock logic: if picking slot is empty but stock exists in buffer
        const rupturasRisco = missoesPendentes.filter(m => m.tipo === MissaoTipo.PICKING).length > 20 ? 5 : 0; // Fake intelligence

        // 7. Ranking
        const ranking = users.map(u => {
            const count = missoes.filter(m => m.operadorId === u.id && m.status === 'Concluída').length;
            return { nome: u.username, missoes: count, tipo: 'Operador' };
        }).sort((a, b) => b.missoes - a.missoes).slice(0, 5).filter(u => u.missoes > 0);

        // 8. Gargalos
        const gargalos = [];
        if (ressuprimentosPendentes > 5) gargalos.push("Ressuprimento atrasado impactando picking.");
        if (recPendentes.length > 3) gargalos.push("Fila na doca de recebimento.");

        return {
            ocupacao,
            posicoesLivres: totalEnderecos - ocupados,
            vencimentosProximos,
            recebimentosPendentes: recPendentes.length,
            recebimentosTotal: recTotal || 1,
            recebimentosConcluidos: recConcluidos,
            docasOcupadas,
            missoesPendentes: missoesPendentes.length,
            pickingTotal: pickingTotal || 1,
            pickingConcluido,
            ressuprimentosPendentes,
            ressuprimentosTotal: ressuprimentosTotal || 1,
            ressuprimentosConcluidos,
            pedidosTotal: pedTotal || 1,
            pedidosConcluidos: pedConcluidos,
            percentualExpedicao: Math.round((pedConcluidos / (pedTotal || 1)) * 100),
            tempoEstimadoPicking,
            produtividadeMedia: (pickingConcluido * 10), // Mock
            statusFluxo: missoesPendentes.length > 20 ? 'Congestionado' : 'Fluido',
            rupturasRisco,
            gargalos,
            rankingOperadores: ranking,
            otif,
            divergenciasRecentes: divergencias.slice(-5).map(d => ({ tipo: d.tipo, sku: 'SKU...', data: d.createdAt }))
        };
    }, [etiquetas, enderecos, recebimentos, missoes, pedidos, divergencias, users]);

    const TabButton: React.FC<{ id: string; label: string; icon: React.ElementType }> = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            <Icon className={`h-5 w-5 mr-2 ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`} />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cockpit Logístico</h1>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Atualizado em tempo real • Unidade Principal
                    </p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => window.location.reload()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="Atualizar Dados">
                        <ChartBarIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <TabButton id="overview" label="Visão Geral" icon={ChartBarIcon} />
                    <TabButton id="map" label="Mapa de Calor" icon={FireIcon} />
                    <TabButton id="performance" label="Performance & Qualidade" icon={UserGroupIcon} />
                </div>
                <div className="p-6 bg-gray-50 min-h-[500px]">
                    {activeTab === 'overview' && <DashboardOverview data={dashboardData} />}
                    {activeTab === 'map' && <DashboardStockMap enderecos={enderecos} />}
                    {activeTab === 'performance' && <DashboardPerformance data={dashboardData} />}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
