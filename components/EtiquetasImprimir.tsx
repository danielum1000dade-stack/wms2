
import React, { useState, useEffect, useRef } from 'react';
import { Recebimento, Etiqueta } from '../types';
import { PrinterIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';

declare const JsBarcode: any;
declare const QRious: any;

interface EtiquetasImprimirProps {
    recebimento?: Recebimento; // Made optional for flexibility (e.g., testing or manual prints)
    etiquetas: Etiqueta[];
    onBack: () => void;
}

const EtiquetaCard: React.FC<{ etiqueta: Etiqueta, recebimento?: Recebimento, index: number, total: number }> = ({ etiqueta, recebimento, index, total }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, etiqueta.id, {
                    format: 'CODE128',
                    displayValue: false,
                    height: 40,
                    width: 2,
                    margin: 0,
                });
            } catch(e) { console.error("Barcode Error", e); }
        }
        if (qrRef.current) {
            try {
                new QRious({
                    element: qrRef.current,
                    value: etiqueta.id,
                    size: 80,
                    padding: 0,
                });
            } catch(e) { console.error("QR Error", e); }
        }
    }, [etiqueta.id]);

    return (
        <div className="etiqueta-card">
            <div className="etiqueta-header">
                <div className="etiqueta-info">
                    <p className="font-bold uppercase text-lg">{recebimento?.fornecedor || 'WMS PRO'}</p>
                    <p>NF: {recebimento?.notaFiscal || 'N/A'}</p>
                    <p>Placa: {recebimento?.placaVeiculo || 'N/A'}</p>
                </div>
                <canvas ref={qrRef} className="qr-code"></canvas>
            </div>
            <div className="etiqueta-body">
                <svg ref={barcodeRef} className="barcode"></svg>
                <p className="font-mono tracking-widest text-lg mt-1">{etiqueta.id}</p>
            </div>
            <div className="etiqueta-footer">
                Etiqueta {index + 1} de {total}
            </div>
        </div>
    );
};

const PrintOptionsModal: React.FC<{ onSelect: (format: 'a4' | 'thermal') => void; onClose: () => void; }> = ({ onSelect, onClose }) => {
    return (
        <Modal title="Selecione o Formato de Impressão" onClose={onClose}>
            <div className="space-y-4">
                <p className="text-gray-600">Escolha o layout de impressão adequado para sua impressora.</p>
                <button
                    onClick={() => onSelect('a4')}
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <h3 className="font-semibold text-lg text-gray-800">Folha A4</h3>
                    <p className="text-sm text-gray-500">Imprime 2 etiquetas por página. Ideal para impressoras jato de tinta ou laser.</p>
                </button>
                <button
                    onClick={() => onSelect('thermal')}
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <h3 className="font-semibold text-lg text-gray-800">Etiqueta Individual (100x80mm)</h3>
                    <p className="text-sm text-gray-500">Imprime uma etiqueta por vez. Ideal para impressoras térmicas (Zebra, Argox, etc.).</p>
                </button>
            </div>
        </Modal>
    );
};


const EtiquetasImprimir: React.FC<EtiquetasImprimirProps> = ({ recebimento, etiquetas, onBack }) => {
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [activePrintFormat, setActivePrintFormat] = useState<'a4' | 'thermal' | null>(null);

    const startPrint = (format: 'a4' | 'thermal') => {
        setActivePrintFormat(format);
        setIsPrintModalOpen(false);
    };

    useEffect(() => {
        if (!activePrintFormat) return;

        const handleAfterPrint = () => {
            setActivePrintFormat(null);
            window.removeEventListener('afterprint', handleAfterPrint);
        };

        window.addEventListener('afterprint', handleAfterPrint);
        
        const timer = setTimeout(() => {
            window.print();
        }, 300); // Increased timeout slightly for better rendering before print

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [activePrintFormat]);
    
    const getPrintStyles = (format: 'a4' | 'thermal' | null) => {
        // Basic styles for screen preview
        const screenStyles = `
            .no-print {
                margin-bottom: 1.5rem;
                padding: 1rem;
                background-color: white;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .etiquetas-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 1rem;
                padding: 1rem;
                background-color: #f3f4f6;
            }
            .etiqueta-card {
                font-family: sans-serif;
                border: 1px solid #e2e8f0;
                background-color: white;
                padding: 12px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                overflow: hidden;
                box-sizing: border-box;
                aspect-ratio: 100 / 80;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .etiqueta-header { display: flex; justify-content: space-between; align-items: flex-start; }
            .etiqueta-info p { margin: 0; line-height: 1.4; }
            .etiqueta-body { text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 8px 0; }
            .barcode { width: 100%; height: auto; max-height: 50px; }
            .qr-code { width: 80px !important; height: 80px !important; }
            .etiqueta-footer { text-align: center; font-weight: bold; border-top: 1px dashed #cbd5e0; padding-top: 8px; font-size: 12px; }
        `;

        // Print isolation: Hide everything else on the page when printing
        const printIsolationStyles = `
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                }
                body * {
                    visibility: hidden;
                }
                #print-root, #print-root * {
                    visibility: visible;
                }
                #print-root {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    background: white;
                }
                .no-print {
                    display: none !important;
                }
                .etiquetas-container {
                    background-color: white !important;
                    padding: 0 !important;
                    gap: 0 !important;
                    display: block !important;
                }
                .etiqueta-card {
                    box-shadow: none !important;
                    border: 1px solid #000 !important;
                    box-sizing: border-box !important;
                    font-size: 10pt !important;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    margin: 0 !important;
                }
            }
        `;

        let formatStyles = '';
        if (format === 'a4') {
            formatStyles = `
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    .etiquetas-container {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                        align-content: flex-start !important;
                        gap: 10mm !important;
                        width: 100%;
                    }
                    .etiqueta-card {
                        width: 100mm !important; /* Approx half width */
                        height: 80mm !important; 
                        border: 1px dashed #999 !important;
                        padding: 5mm !important;
                        page-break-inside: avoid !important;
                        margin-bottom: 5mm !important;
                    }
                }
            `;
        } else if (format === 'thermal') {
            formatStyles = `
                 @media print {
                    @page { size: 100mm 80mm; margin: 0; }
                    .etiquetas-container {
                        display: block !important;
                    }
                    .etiqueta-card {
                        width: 100mm !important;
                        height: 80mm !important;
                        border: none !important;
                        padding: 2mm !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        position: relative;
                        left: 0;
                        top: 0;
                    }
                     .etiqueta-card:last-of-type {
                        page-break-after: auto !important;
                    }
                }
            `;
        }
        
        return screenStyles + printIsolationStyles + formatStyles;
    };

    return (
        <div id="print-root" className="bg-gray-100 min-h-screen p-4">
            <style>{getPrintStyles(activePrintFormat)}</style>
            
            <div className="no-print">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visualização de Impressão</h1>
                    <p className="text-gray-600">{etiquetas.length} etiqueta(s) selecionada(s).</p>
                </div>
                <div className="flex space-x-2">
                     <button
                        onClick={onBack}
                        className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition-colors"
                    >
                        <ArrowUturnLeftIcon className="h-5 w-5 mr-2" /> Voltar
                    </button>
                    <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors animate-pulse"
                    >
                        <PrinterIcon className="h-5 w-5 mr-2" /> Imprimir Agora
                    </button>
                </div>
            </div>

            <div className="etiquetas-container">
                {etiquetas.map((etiqueta, index) => (
                    <EtiquetaCard key={etiqueta.id} etiqueta={etiqueta} recebimento={recebimento} index={index} total={etiquetas.length} />
                ))}
            </div>

            {isPrintModalOpen && (
                <PrintOptionsModal 
                    onSelect={startPrint} 
                    onClose={() => setIsPrintModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default EtiquetasImprimir;
