import React from 'react';
import { Recebimento, Divergencia } from '../types';
import { useWMS } from '../context/WMSContext';
import { ArrowUturnLeftIcon, PrinterIcon, TableCellsIcon } from '@heroicons/react/24/outline';
declare const XLSX: any;

interface RomaneioDescargaProps {
    recebimento: Recebimento;
    onBack: () => void;
}

type ResumoSKU = {
    sku: string;
    descritivo: string;
    qtd: number;
    peso: number;
}

const RomaneioDescarga: React.FC<RomaneioDescargaProps> = ({ recebimento, onBack }) => {
    const { getEtiquetasByRecebimento, skus, enderecos, getDivergenciasByRecebimento } = useWMS();
    const etiquetas = getEtiquetasByRecebimento(recebimento.id);
    const divergencias = getDivergenciasByRecebimento(recebimento.id);

    const resumoNF: ResumoSKU[] = etiquetas.reduce((acc, etiqueta) => {
        if (!etiqueta.skuId) return acc;

        const sku = skus.find(s => s.id === etiqueta.skuId);
        if (!sku) return acc;

        const existingEntry = acc.find(item => item.sku === sku.sku);
        const quantidade = etiqueta.quantidadeCaixas || 0;

        if (existingEntry) {
            existingEntry.qtd += quantidade;
        } else {
            acc.push({
                sku: sku.sku,
                descritivo: sku.descritivo,
                qtd: quantidade,
                peso: 0, // Peso total pode ser calculado aqui se necessário
            });
        }
        return acc;
    }, [] as ResumoSKU[]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const ws_data: (string | number | null)[][] = [];
        const merges: any[] = [];
        let rowIndex = 0;

        // Header
        ws_data.push(['ROMANEIO DE DESCARGA - CONTROLE DE PRODUTOS E DEVOLUÇÕES']);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push(['RECEBIDOS']);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push([]); // Spacer
        rowIndex++;

        // Info Grid
        ws_data.push(['Placa do Veículo', null, 'NF:', null, 'Lacre:', null, 'Doca:', null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
        merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push([recebimento.placaVeiculo, null, recebimento.notaFiscal, null, recebimento.lacre, null, recebimento.doca, null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
        merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        
        ws_data.push(['ORIGEM:', null, null, 'Transportador:', null, null, null, null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 2 } });
        merges.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 5 } });
        rowIndex++;
        ws_data.push([recebimento.fornecedor, null, null, recebimento.transportador, null, null, null, null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 2 } });
        merges.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 5 } });
        rowIndex++;

        ws_data.push(['Data prevista da descarga:', null, 'Horário previsto:', null, 'Data Chegada', null, 'Horário Chegada', null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
        merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push([
            recebimento.dataPrevista, null, 
            recebimento.horaPrevista, null, 
            new Date(recebimento.dataHoraChegada).toLocaleDateString('pt-BR'), null, 
            new Date(recebimento.dataHoraChegada).toLocaleTimeString('pt-BR'), null
        ]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
        merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;

        // Temperature
        ws_data.push(['Controle de Temperatura do Veículo']);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push(['Temperatura TermoKing', null, 'Temperatura do Baú', null, 'Início', 'Meio', 'Fim', null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
        merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push([
            recebimento.temperaturaTermoKing, null, 
            recebimento.temperaturaVeiculo, null, 
            recebimento.temperaturaInicio, 
            recebimento.temperaturaMeio, 
            recebimento.temperaturaFim, null
        ]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
        merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push([]); // Spacer
        rowIndex++;

        // Main Table
        ws_data.push(['SKU', 'LOTE', 'QTD', 'PESO', 'POSIÇÃO PALLET', null, 'OBSERVAÇÃO', null]);
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        const mainTableHeaderIndex = rowIndex;
        rowIndex++;

        etiquetas.forEach(et => {
            const sku = skus.find(s => s.id === et.skuId);
            const endereco = enderecos.find(e => e.id === et.enderecoId);
            ws_data.push([
                sku?.sku || '',
                et.lote || '',
                et.quantidadeCaixas || 0,
                sku?.peso || 0,
                endereco?.nome || 'N/A',
                null,
                et.observacoes || '',
                null
            ]);
            merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
            merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
            rowIndex++;
        });

        // Add padding rows
        const paddingRows = 15 - etiquetas.length;
        for (let i = 0; i < paddingRows; i++) {
            ws_data.push([null, null, null, null, null, null, null, null]);
            merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 7 } });
            rowIndex++;
        }
        ws_data.push([]); // Spacer
        rowIndex++;

        // Divergencias & Conferencia NF
        ws_data.push(['DIVERGÊNCIAS', null, null, null, 'CONFERÊNCIA NF', null, null, null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 3 } });
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push(['SKU', 'TIPO', 'QTD', 'OBSERVAÇÃO', 'SKU', 'QTD', 'PESO', null]);
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        
        const maxRows = Math.max(4, resumoNF.length, divergencias.length);
        for(let i = 0; i < maxRows; i++) {
            const resumo = resumoNF[i];
            const divergencia = divergencias[i];
            const skuDivergencia = divergencia ? skus.find(s => s.id === divergencia.skuId) : null;
            ws_data.push([
                skuDivergencia?.sku || null, // Divergencias
                divergencia?.tipo || null,
                divergencia?.quantidade || null,
                divergencia?.observacao || null,
                resumo?.sku || null, // Conferencia
                resumo?.qtd || null,
                resumo?.peso || null,
                null
            ]);
            merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
            rowIndex++;
        }

        ws_data.push([]); // Spacer
        rowIndex++;

        // Footer
        ws_data.push(['Controle de Avarias', null, null, null, 'Responsável', null, 'Motorista', null]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 2 } });
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;
        ws_data.push(['Houve avarias?', recebimento.houveAvarias ? '(X) SIM ( ) NÃO' : '( ) SIM (X) NÃO', null, null, null, null, null, null]);
        merges.push({ s: { r: rowIndex, c: 4 }, e: { r: rowIndex, c: 5 } });
        merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
        rowIndex++;


        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!merges'] = merges;
        
        ws['!cols'] = [
            { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
            { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Romaneio de Descarga");
        XLSX.writeFile(wb, `Romaneio_NF_${recebimento.notaFiscal}.xlsx`);
    };

    const Field: React.FC<{ label: string, value: any, className?: string }> = ({ label, value, className }) => (
        <div className={`border border-gray-400 p-1 ${className}`}>
            <div className="text-xs font-bold text-gray-600">{label}</div>
            <div className="text-sm font-semibold text-center">{value || '-'}</div>
        </div>
    );
    
    return (
        <div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                    .print-table { font-size: 8pt; }
                    .print-table th, .print-table td { padding: 2px 4px; }
                }
            `}</style>
            
            <div className="no-print mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Romaneio de Descarga</h1>
                    <p className="text-gray-600">NF: {recebimento.notaFiscal}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={onBack} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600">
                        <ArrowUturnLeftIcon className="h-5 w-5 mr-2"/> Voltar
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <TableCellsIcon className="h-5 w-5 mr-2"/> Exportar Excel
                    </button>
                    <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                        <PrinterIcon className="h-5 w-5 mr-2"/> Imprimir
                    </button>
                </div>
            </div>

            <div id="print-area" className="bg-white p-4 shadow-lg rounded-lg mx-auto max-w-4xl text-black">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-2 mb-2">
                    <h2 className="text-xl font-bold">ROMANEIO DE DESCARGA - CONTROLE DE PRODUTOS E DEVOLUÇÕES</h2>
                    <h3 className="text-lg font-semibold">RECEBIDOS</h3>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-8 text-sm">
                    <Field label="Placa do Veículo" value={recebimento.placaVeiculo} className="col-span-2"/>
                    <Field label="NF:" value={recebimento.notaFiscal} className="col-span-2"/>
                    <Field label="Lacre:" value={recebimento.lacre} className="col-span-2"/>
                    <Field label="Doca:" value={recebimento.doca} className="col-span-2"/>

                    <Field label="ORIGEM:" value={recebimento.fornecedor} className="col-span-3"/>
                    <Field label="Transportador:" value={recebimento.transportador} className="col-span-3"/>
                    <div className="col-span-2"></div>
                    
                    <Field label="Data prevista da descarga:" value={recebimento.dataPrevista} className="col-span-2"/>
                    <Field label="Horário previsto da descarga:" value={recebimento.horaPrevista} className="col-span-2"/>
                    <Field label="Data Chegada" value={new Date(recebimento.dataHoraChegada).toLocaleDateString('pt-BR')} className="col-span-2"/>
                    <Field label="Horário Chegada" value={new Date(recebimento.dataHoraChegada).toLocaleTimeString('pt-BR')} className="col-span-2"/>

                    <div className="col-span-8 border border-gray-400 p-1 mt-1 text-center font-bold text-gray-700">
                        Controle de Temperatura do Veículo
                    </div>
                    <Field label="Temperatura TermoKing" value={recebimento.temperaturaTermoKing} className="col-span-2"/>
                    <Field label="Temperatura do Baú" value={recebimento.temperaturaVeiculo} className="col-span-2"/>
                    <Field label="Início" value={recebimento.temperaturaInicio} className="col-span-1"/>
                    <Field label="Meio" value={recebimento.temperaturaMeio} className="col-span-1"/>
                    <Field label="Fim" value={recebimento.temperaturaFim} className="col-span-2"/>
                </div>

                {/* Main Table */}
                <table className="w-full mt-2 border-collapse border border-gray-400 print-table">
                    <thead>
                        <tr className="bg-gray-200">
                            {['SKU', 'LOTE', 'QTD', 'PESO', 'POSIÇÃO PALLET', 'OBSERVAÇÃO'].map(h => 
                                <th key={h} className="border border-gray-400 p-1 text-xs font-bold">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {etiquetas.map(et => {
                            const sku = skus.find(s => s.id === et.skuId);
                            const endereco = enderecos.find(e => e.id === et.enderecoId);
                            return (
                                <tr key={et.id}>
                                    <td className="border border-gray-400 p-1 text-center text-xs">{sku?.sku}</td>
                                    <td className="border border-gray-400 p-1 text-center text-xs">{et.lote}</td>
                                    <td className="border border-gray-400 p-1 text-center text-xs">{et.quantidadeCaixas}</td>
                                    <td className="border border-gray-400 p-1 text-center text-xs">{sku?.peso || 0}</td>
                                    <td className="border border-gray-400 p-1 text-center text-xs">{endereco?.nome}</td>
                                    <td className="border border-gray-400 p-1 text-center text-xs">{et.observacoes}</td>
                                </tr>
                            );
                        })}
                        {/* Empty rows */}
                        {Array.from({ length: Math.max(0, 15 - etiquetas.length) }).map((_, i) => (
                            <tr key={`empty-${i}`}><td className="border border-gray-400 p-1 h-6" colSpan={6}></td></tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Other tables */}
                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <h4 className="font-bold text-center bg-gray-200 border border-gray-400 p-1">DIVERGÊNCIAS</h4>
                        <table className="w-full border-collapse border border-gray-400 print-table">
                             <thead><tr className="bg-gray-200">
                                <th className="border border-gray-400 p-1 text-xs font-bold">SKU</th>
                                <th className="border border-gray-400 p-1 text-xs font-bold">TIPO</th>
                                <th className="border border-gray-400 p-1 text-xs font-bold">QTD</th>
                                <th className="border border-gray-400 p-1 text-xs font-bold">OBSERVAÇÃO</th>
                             </tr></thead>
                             <tbody>
                                {divergencias.map((div, i) => {
                                    const sku = skus.find(s => s.id === div.skuId);
                                    return (
                                        <tr key={`div-${i}`}>
                                            <td className="border border-gray-400 p-1 text-center text-xs">{sku?.sku}</td>
                                            <td className="border border-gray-400 p-1 text-center text-xs">{div.tipo}</td>
                                            <td className="border border-gray-400 p-1 text-center text-xs">{div.quantidade}</td>
                                            <td className="border border-gray-400 p-1 text-center text-xs">{div.observacao}</td>
                                        </tr>
                                    )
                                })}
                                {Array.from({ length: Math.max(0, 4 - divergencias.length) }).map((_, i) => (
                                    <tr key={`div-empty-${i}`}><td className="border border-gray-400 h-6" colSpan={4}></td></tr>
                                ))}
                             </tbody>
                        </table>
                    </div>
                    <div>
                        <h4 className="font-bold text-center bg-gray-200 border border-gray-400 p-1">CONFERÊNCIA NF</h4>
                        <table className="w-full border-collapse border border-gray-400 print-table">
                            <thead><tr className="bg-gray-200">
                                <th className="border border-gray-400 p-1 text-xs font-bold">SKU</th>
                                <th className="border border-gray-400 p-1 text-xs font-bold">QTD</th>
                                <th className="border border-gray-400 p-1 text-xs font-bold">PESO</th>
                            </tr></thead>
                            <tbody>
                                {resumoNF.map((item, i) => (
                                    <tr key={`conf-${i}`}>
                                        <td className="border border-gray-400 p-1 text-center text-xs">{item.sku}</td>
                                        <td className="border border-gray-400 p-1 text-center text-xs">{item.qtd}</td>
                                        <td className="border border-gray-400 p-1 text-center text-xs">{item.peso}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 10 - resumoNF.length) }).map((_, i) => (
                                    <tr key={`empty-conf-${i}`}><td className="border border-gray-400 h-6" colSpan={3}></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="font-bold border border-gray-400 p-1 text-center">Controle de Avarias</div>
                        <div className="grid grid-cols-2 border-b border-l border-r border-gray-400">
                            <div className="p-1">Houve avarias?</div>
                            <div className="border-l border-gray-400 p-1">
                                {recebimento.houveAvarias ? '(X) SIM ( ) NÃO' : '( ) SIM (X) NÃO'}
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="border-b-2 border-black h-10"></div>
                                <div className="text-center font-bold">Responsável</div>
                            </div>
                            <div>
                                <div className="border-b-2 border-black h-10"></div>
                                <div className="text-center font-bold">Motorista</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RomaneioDescarga;