
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { ArchiveBoxIcon, PrinterIcon, TableCellsIcon, DocumentChartBarIcon, ExclamationTriangleIcon, ClockIcon, TruckIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { EtiquetaStatus, EnderecoStatus, MissaoTipo } from '../types';

const RelatoriosPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('operacional');

    const TabButton: React.FC<{ tabName: string; label: string, icon: React.ElementType }> = ({ tabName, label, icon: Icon }) => (
        <button
            onClick={() => setActiveCategory(tabName)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeCategory === tabName ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            <Icon className="h-5 w-5 mr-2" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Central de Inteligência e Relatórios</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex space-x-2 border-b border-gray-200 mb-6 pb-2 overflow-x-auto">
                    <TabButton tabName="operacional" label="Operacional (Estoque)" icon={ArchiveBoxIcon} />
                    <TabButton tabName="recebimento" label="Recebimento" icon={TruckIcon} />
                    <TabButton tabName="armazenagem" label="Armazenagem" icon={TableCellsIcon} />
                    <TabButton tabName="picking" label="Picking" icon={ClipboardDocumentCheckIcon} />
                    <TabButton tabName="expedicao" label="Expedição" icon={TruckIcon} />
                    <TabButton tabName="inventario" label="Inventário" icon={ArchiveBoxIcon}/>
                    <TabButton tabName="auditoria" label="Auditoria" icon={ExclamationTriangleIcon} />
                    <TabButton tabName="kpi" label="KPIs" icon={DocumentChartBarIcon} />
                </div>

                <div className="p-2">
                    {activeCategory === 'operacional' && <RelatorioOperacional />}
                    {activeCategory === 'recebimento' && <RelatorioRecebimento />}
                    {activeCategory === 'armazenagem' && <RelatorioArmazenagem />}
                    {activeCategory === 'picking' && <RelatorioPicking />}
                    {activeCategory === 'expedicao' && <RelatorioExpedicao />}
                    {activeCategory === 'inventario' && <RelatorioInventario />}
                    {activeCategory === 'auditoria' && <RelatorioAuditoria />}
                    {activeCategory === 'kpi' && <RelatorioKPIs />}
                </div>
            </div>
        </div>
    )
};

// --- SUB-RELATÓRIOS ---

const RelatorioOperacional: React.FC = () => {
    const { etiquetas, skus, enderecos } = useWMS();
    
    const reportData = useMemo(() => {
        return etiquetas.filter(e => e.status === EtiquetaStatus.ARMAZENADA).map(et => {
            const sku = skus.find(s => s.id === et.skuId);
            const addr = enderecos.find(e => e.id === et.enderecoId);
            return {
                id: et.id,
                sku: sku?.sku,
                desc: sku?.descritivo,
                endereco: addr?.codigo,
                qtd: et.quantidadeCaixas,
                validade: et.validade,
                lote: et.lote
            }
        });
    }, [etiquetas, skus, enderecos]);

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">1. Estoque Geral e Disponibilidade</h3>
            <SimpleTable 
                headers={['Pallet', 'SKU', 'Descrição', 'Endereço', 'Qtd', 'Lote', 'Validade']}
                data={reportData.map(d => [d.id, d.sku, d.desc, d.endereco, d.qtd, d.lote, d.validade])}
            />
        </div>
    );
};

const RelatorioRecebimento: React.FC = () => {
    const { recebimentos } = useWMS();
    return (
        <div>
            <h3 className="text-lg font-bold mb-4">9. Previsão e Histórico de Recebimento</h3>
            <SimpleTable 
                headers={['NF', 'Fornecedor', 'Chegada', 'Status', 'Avarias?']}
                data={recebimentos.map(r => [r.notaFiscal, r.fornecedor, new Date(r.dataHoraChegada).toLocaleDateString(), r.status, r.houveAvarias ? 'SIM' : 'NÃO'])}
            />
        </div>
    );
};

const RelatorioArmazenagem: React.FC = () => {
    const { enderecos } = useWMS();
    const ocupacao = enderecos.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="grid grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-bold mb-4">16. Utilização de Espaço</h3>
                <div className="bg-gray-100 p-4 rounded">
                    <p>Livres: {ocupacao[EnderecoStatus.LIVRE] || 0}</p>
                    <p>Ocupados: {ocupacao[EnderecoStatus.OCUPADO] || 0}</p>
                    <p>Bloqueados: {ocupacao[EnderecoStatus.BLOQUEADO] || 0}</p>
                    <p className="font-bold mt-2">Total: {enderecos.length}</p>
                </div>
            </div>
        </div>
    );
};

const RelatorioPicking: React.FC = () => {
    const { missoes, skus, users } = useWMS();
    const pickingMissions = missoes.filter(m => m.tipo === MissaoTipo.PICKING);

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">18. Performance de Picking e Ondas</h3>
            <SimpleTable 
                headers={['Missão', 'SKU', 'Qtd', 'Origem', 'Operador', 'Status']}
                data={pickingMissions.map(m => {
                    const sku = skus.find(s => s.id === m.skuId);
                    const op = users.find(u => u.id === m.operadorId);
                    return [m.id, sku?.sku, m.quantidade, '...', op?.username || 'N/A', m.status];
                })}
            />
        </div>
    );
};

const RelatorioExpedicao: React.FC = () => {
    const { pedidos } = useWMS();
    return (
        <div>
            <h3 className="text-lg font-bold mb-4">21. Controle de Expedição (Pré-Romaneio)</h3>
            <SimpleTable 
                headers={['Pedido', 'Transporte', 'Status', 'Prioridade']}
                data={pedidos.map(p => [p.id, p.numeroTransporte, p.status, p.priority ? 'ALTA' : 'NORMAL'])}
            />
        </div>
    );
};

const RelatorioInventario: React.FC = () => {
    const { inventoryCountSessions } = useWMS();
    return (
        <div>
            <h3 className="text-lg font-bold mb-4">25. Histórico de Inventários</h3>
            <SimpleTable 
                headers={['Data', 'Área', 'Progresso', 'Status']}
                data={inventoryCountSessions.map(s => [new Date(s.createdAt).toLocaleDateString(), s.filters.area, `${s.locationsCounted}/${s.totalLocations}`, s.status])}
            />
        </div>
    );
};

const RelatorioAuditoria: React.FC = () => {
    const { auditLogs } = useWMS();
    return (
        <div>
            <h3 className="text-lg font-bold mb-4">30. Auditoria Completa de Operações</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Data/Hora</th>
                            <th className="px-4 py-2 text-left">Usuário</th>
                            <th className="px-4 py-2 text-left">Ação</th>
                            <th className="px-4 py-2 text-left">Entidade</th>
                            <th className="px-4 py-2 text-left">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.slice(0, 50).map(log => (
                            <tr key={log.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-2 font-medium">{log.userName}</td>
                                <td className="px-4 py-2"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{log.actionType}</span></td>
                                <td className="px-4 py-2">{log.entity} ({log.entityId})</td>
                                <td className="px-4 py-2 text-gray-600">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RelatorioKPIs: React.FC = () => {
    return (
        <div className="grid grid-cols-3 gap-4">
            <KPICard title="Acuracidade de Estoque" value="99.8%" color="green" />
            <KPICard title="Pedidos / Hora" value="45" color="blue" />
            <KPICard title="Tempo Médio Recebimento" value="32 min" color="indigo" />
            <KPICard title="Ocupação Picking" value="82%" color="yellow" />
            <KPICard title="Taxa de Devolução" value="0.5%" color="green" />
            <KPICard title="Ressuprimentos Pendentes" value="12" color="red" />
        </div>
    );
};

// --- HELPERS ---

const KPICard: React.FC<{ title: string, value: string, color: string }> = ({ title, value, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 border-${color}-500`}>
        <h4 className="text-gray-500 text-sm uppercase">{title}</h4>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
);

const SimpleTable: React.FC<{ headers: string[], data: any[][] }> = ({ headers, data }) => (
    <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
                <tr>
                    {headers.map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? data.map((row, i) => (
                    <tr key={i}>
                        {row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>)}
                    </tr>
                )) : (
                    <tr><td colSpan={headers.length} className="p-4 text-center text-gray-500">Sem dados disponíveis.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

export default RelatoriosPage;
