
import React, { useState, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { Etiqueta, Endereco, SKU, EtiquetaStatus, EnderecoTipo, EnderecoStatus } from '../types';
import { CameraIcon, CheckCircleIcon, LightBulbIcon, MapPinIcon, XCircleIcon } from '@heroicons/react/24/outline';

declare const Html5QrcodeScanner: any;

interface SuggestedEndereco {
    endereco: Endereco;
    motivo: string;
}

interface ActionPanelProps {
    selectedEtiqueta: Etiqueta | null;
    skus: SKU[];
    suggestedEndereco: SuggestedEndereco | null;
    finalEndereco: Endereco | null;
    setFinalEndereco: React.Dispatch<React.SetStateAction<Endereco | null>>;
    manualAddressInput: string;
    setManualAddressInput: React.Dispatch<React.SetStateAction<string>>;
    enderecos: Endereco[];
    setErrorFeedback: React.Dispatch<React.SetStateAction<string | null>>;
    isAddressScanning: boolean;
    setIsAddressScanning: React.Dispatch<React.SetStateAction<boolean>>;
    handleManualConfirm: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
    selectedEtiqueta,
    skus,
    suggestedEndereco,
    finalEndereco,
    setFinalEndereco,
    manualAddressInput,
    setManualAddressInput,
    enderecos,
    setErrorFeedback,
    isAddressScanning,
    setIsAddressScanning,
    handleManualConfirm,
}) => {
    if (!selectedEtiqueta) {
        return <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg text-gray-500">Selecione ou leia um pallet para começar</div>;
    }

    if(finalEndereco){
         return (
            <div className="p-6 bg-white rounded-lg shadow-inner space-y-4 text-center">
                <MapPinIcon className="h-12 w-12 mx-auto text-indigo-500" />
                <h3 className="text-lg font-semibold">3. Confirmar Movimentação</h3>
                <p>Movendo pallet <span className="font-mono">{selectedEtiqueta.id}</span> para o endereço:</p>
                <p className="text-2xl font-bold text-indigo-600 bg-indigo-50 py-2 px-4 rounded-md">{finalEndereco.nome}</p>
                <div className="space-y-2">
                    <button
                        onClick={() => setIsAddressScanning(!isAddressScanning)}
                        className={`w-full flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg shadow-md transition-colors ${isAddressScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isAddressScanning ? <XCircleIcon className="h-6 w-6 mr-2"/> : <CameraIcon className="h-6 w-6 mr-2"/>}
                        {isAddressScanning ? 'Cancelar Leitura' : 'Escanear Endereço para Confirmar'}
                    </button>
                    <button
                        onClick={handleManualConfirm}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
                        Confirmar Manualmente
                    </button>
                </div>
                {isAddressScanning && <div id="address-reader" className="w-full mx-auto mt-4 border rounded-lg"></div>}
            </div>
        );
    }

    const sku = skus.find(s => s.id === selectedEtiqueta.skuId);

    return (
        <div className="p-6 bg-white rounded-lg shadow-inner space-y-6">
            <div>
                <h3 className="text-lg font-semibold">2. Definir Endereço de Destino</h3>
                <p className="font-mono text-indigo-700">{selectedEtiqueta.id}</p>
                <p className="text-sm text-gray-600">{sku?.descritivo}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold flex items-center text-yellow-800"><LightBulbIcon className="h-5 w-5 mr-2"/> Endereço Sugerido (IA Explicável)</h4>
                {suggestedEndereco ? (
                    <>
                        <p className="text-xl font-bold text-gray-800 my-2">{suggestedEndereco.endereco.nome}</p>
                        <p className="text-xs text-yellow-700 italic mb-2">Motivo: {suggestedEndereco.motivo}</p>
                        <button onClick={() => setFinalEndereco(suggestedEndereco.endereco)} className="w-full bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-500">
                            Usar Sugestão
                        </button>
                    </>
                ) : (
                     <p className="text-gray-600 mt-2">Nenhuma posição ideal encontrada. Verifique os cadastros de endereço ou SRE.</p>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-gray-700">Endereçamento Manual</h4>
                <p className="text-sm text-gray-500 mb-2">Digite ou escaneie um endereço de destino.</p>
                 <div className="flex items-center space-x-2">
                    <input 
                        type="text"
                        placeholder="Ex: A01-01-A"
                        value={manualAddressInput}
                        onChange={(e) => setManualAddressInput(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                    />
                    <button
                        onClick={() => {
                            const addressToFind = manualAddressInput.toUpperCase();
                            const found = enderecos.find(end => end.codigo.toUpperCase() === addressToFind);
                            if (found) {
                                if (found.status !== EnderecoStatus.LIVRE) {
                                    setErrorFeedback(`Endereço "${found.codigo}" está ${found.status}!`);
                                } else {
                                    setFinalEndereco(found);
                                    setErrorFeedback(null);
                                }
                            } else if (manualAddressInput) {
                                setErrorFeedback('Endereço não encontrado.');
                            }
                        }}
                        className="flex-shrink-0 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600"
                    >
                        Usar
                    </button>
                </div>
            </div>
        </div>
    );
};


const ArmazenagemPage: React.FC = () => {
    const { etiquetas, enderecos, skus, armazenarEtiqueta } = useWMS();
    
    const [palletsParaArmazenar, setPalletsParaArmazenar] = useState<Etiqueta[]>([]);
    const [selectedEtiqueta, setSelectedEtiqueta] = useState<Etiqueta | null>(null);
    const [suggestedEndereco, setSuggestedEndereco] = useState<SuggestedEndereco | null>(null);
    const [manualAddressInput, setManualAddressInput] = useState('');
    const [finalEndereco, setFinalEndereco] = useState<Endereco | null>(null);
    
    const [palletIdInput, setPalletIdInput] = useState('');
    const [isPalletScanning, setIsPalletScanning] = useState(false);
    const [isAddressScanning, setIsAddressScanning] = useState(false);
    
    const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
    const [lastStoredInfo, setLastStoredInfo] = useState<{ palletId: string, enderecoNome: string } | null>(null);

    const scannerRef = useRef<any>(null);
    const palletCardRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

    useEffect(() => {
        setPalletsParaArmazenar(etiquetas.filter(e => e.status === EtiquetaStatus.APONTADA));
    }, [etiquetas]);

    const findSuggestedAddress = (sku: SKU): SuggestedEndereco | null => {
        const enderecosDisponiveis = enderecos.filter(e => 
            e.status === EnderecoStatus.LIVRE && 
            e.tipo === EnderecoTipo.ARMAZENAGEM
        );
    
        if (enderecosDisponiveis.length === 0) return null;
    
        const skuSres = [sku.sre1, sku.sre2, sku.sre3, sku.sre4, sku.sre5].filter(Boolean);
    
        let bestMatch: { endereco: Endereco, score: number, motivo: string } | null = null;
    
        for (const endereco of enderecosDisponiveis) {
            let score = 0;
            let motivo = '';
    
            // SRE Matching (high priority)
            const endSres = [endereco.sre1, endereco.sre2, endereco.sre3, endereco.sre4, endereco.sre5].filter(Boolean);
            const sreMatch = skuSres.some(sre => endSres.includes(sre));
            if (sreMatch) {
                score += 1000;
                motivo = 'Compatível com as regras de armazenagem (SRE).';
            } else if (endSres.length > 0) {
                continue; // Skip if address has SREs but none match
            }
    
            // Affinity Score (proximity to same SKU)
            // This is a simple simulation. A real implementation would check neighbors.
            const hasSameSkuNearby = etiquetas.some(et => 
                et.skuId === sku.id && 
                et.enderecoId && 
                enderecos.find(e => e.id === et.enderecoId)?.codigo.startsWith(endereco.codigo.substring(0, 3))
            );
            if (hasSameSkuNearby) {
                score += 100;
                motivo += ' Próximo a outros pallets da mesma família.';
            }
            
            // Proximity to Expedition (ABC proxy)
            // Lower 'A' numbers are closer
            const corredorCode = endereco.codigo.charCodeAt(0);
            score -= corredorCode; // 'A' (65) will have a higher score than 'Z' (90)
            
            if (!motivo) {
                 motivo = 'Posição genérica disponível.';
            }

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { endereco, score, motivo: motivo.trim() };
            }
        }
        
        return bestMatch ? { endereco: bestMatch.endereco, motivo: bestMatch.motivo } : null;
    };

    const handleSelectEtiqueta = (etiqueta: Etiqueta) => {
        resetState(true);
        setErrorFeedback(null);
        setSelectedEtiqueta(etiqueta);
        setPalletIdInput(etiqueta.id);

        palletCardRefs.current[etiqueta.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const skuDoPallet = skus.find(s => s.id === etiqueta.skuId);
        if (skuDoPallet) {
            const sugestao = findSuggestedAddress(skuDoPallet);
            setSuggestedEndereco(sugestao);
        }
    };
    
    const resetState = (keepPalletSelection = false) => {
        if (!keepPalletSelection) {
            setSelectedEtiqueta(null);
            setPalletIdInput('');
        }
        setSuggestedEndereco(null);
        setManualAddressInput('');
        setFinalEndereco(null);
        setIsAddressScanning(false);
        setIsPalletScanning(false);
    }

    const handleFindPallet = (id: string) => {
        if (!id) return;
        const pallet = palletsParaArmazenar.find(e => e.id.toLowerCase() === id.toLowerCase());
        if (pallet) {
            handleSelectEtiqueta(pallet);
        } else {
            resetState();
            setErrorFeedback('Pallet não encontrado ou não está aguardando armazenagem.');
        }
    };
    
    useEffect(() => {
        if (isPalletScanning) {
            const palletScanner = new Html5QrcodeScanner("pallet-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            const onPalletScanSuccess = (decodedText: string) => {
                setPalletIdInput(decodedText);
                handleFindPallet(decodedText);
                setIsPalletScanning(false);
            };
            palletScanner.render(onPalletScanSuccess, () => {});

            return () => {
                palletScanner.clear().catch(err => console.error("Pallet scanner clear failed", err));
            }
        }
    }, [isPalletScanning, palletsParaArmazenar]);

    useEffect(() => {
        if (isAddressScanning && finalEndereco) {
            scannerRef.current = new Html5QrcodeScanner("address-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scannerRef.current.render(onAddressScanSuccess, () => {});
        } else if (scannerRef.current?.getState() !== 1) {
             scannerRef.current?.clear().catch((err: any) => console.error("Scanner clear failed", err));
        }
        return () => {
             if (scannerRef.current?.getState() !== 1) {
                 scannerRef.current?.clear().catch((err: any) => console.error("Scanner clear failed", err));
             }
        }
    }, [isAddressScanning, finalEndereco]);

    const onAddressScanSuccess = (decodedText: string) => {
        if (!finalEndereco || !selectedEtiqueta) return;
        
        setIsAddressScanning(false);

        if (decodedText.toUpperCase() === finalEndereco.codigo.toUpperCase()) {
            const result = armazenarEtiqueta(selectedEtiqueta.id, finalEndereco.id);
            if(result.success) {
                const info = { palletId: selectedEtiqueta.id, enderecoNome: finalEndereco.nome };
                setLastStoredInfo(info);
                resetState();
                setTimeout(() => setLastStoredInfo(null), 3000);
            } else {
                 setErrorFeedback(result.message || 'Falha ao armazenar. Tente novamente.');
            }
        } else {
            setErrorFeedback(`Endereço incorreto! Escaneado: ${decodedText}. Esperado: ${finalEndereco.codigo}.`);
        }
    };

    const handleManualConfirm = () => {
        if (!finalEndereco || !selectedEtiqueta) return;
    
        const result = armazenarEtiqueta(selectedEtiqueta.id, finalEndereco.id);
        
        if (result.success) {
            const info = { palletId: selectedEtiqueta.id, enderecoNome: finalEndereco.nome };
            setLastStoredInfo(info);
            resetState();
            setTimeout(() => setLastStoredInfo(null), 3000);
        } else {
            setErrorFeedback(result.message || 'Ocorreu um erro desconhecido na armazenagem.');
        }
    };

    const PalletCard: React.FC<{ etiqueta: Etiqueta }> = ({ etiqueta }) => {
        const sku = skus.find(s => s.id === etiqueta.skuId);
        return (
            <div 
                // FIX: Wrapped ref assignment in curly braces to ensure it returns void.
                ref={el => { palletCardRefs.current[etiqueta.id] = el; }}
                onClick={() => handleSelectEtiqueta(etiqueta)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedEtiqueta?.id === etiqueta.id ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-300' : 'bg-white hover:bg-gray-50'}`}
            >
                <p className="font-mono font-bold text-gray-800">{etiqueta.id}</p>
                <p className="text-sm text-gray-600">{sku?.sku} - {sku?.descritivo}</p>
                <p className="text-xs text-gray-500">Qtd: {etiqueta.quantidadeCaixas} | Lote: {etiqueta.lote}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Armazenagem de Pallets</h1>
            
            {lastStoredInfo && (
                <div className="p-4 rounded-md bg-green-100 text-green-800 animate-fade-in">
                    Pallet <strong>{lastStoredInfo.palletId}</strong> armazenado em <strong>{lastStoredInfo.enderecoNome}</strong> com sucesso!
                </div>
            )}
            
            {errorFeedback && (
                <div className="p-4 rounded-md bg-red-100 text-red-800">
                    {errorFeedback}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                     <h2 className="text-xl font-semibold mb-4">1. Selecionar Pallet</h2>
                    <div className="mb-4">
                        <label htmlFor="pallet-id-input" className="block text-sm font-medium text-gray-700">Ler Código do Pallet</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                id="pallet-id-input"
                                value={palletIdInput}
                                onChange={e => setPalletIdInput(e.target.value)}
                                onBlur={() => handleFindPallet(palletIdInput)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFindPallet(palletIdInput)}
                                placeholder="Leia ou digite o código"
                                className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            />
                            <button
                                onClick={() => setIsPalletScanning(!isPalletScanning)}
                                type="button"
                                className={`relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isPalletScanning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-50'}`}
                            >
                                {isPalletScanning ? <XCircleIcon className="h-5 w-5" /> : <CameraIcon className="h-5 w-5 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    {isPalletScanning && <div id="pallet-reader" className="w-full mx-auto my-4 border rounded-lg"></div>}

                    <h3 className="text-lg font-semibold mb-2">Aguardando Armazenagem ({palletsParaArmazenar.length})</h3>
                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
                        {palletsParaArmazenar.length > 0 ? (
                             palletsParaArmazenar.map(et => <PalletCard key={et.id} etiqueta={et} />)
                        ) : (
                            <p className="text-gray-500">Nenhum pallet para armazenar no momento.</p>
                        )}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <ActionPanel
                        selectedEtiqueta={selectedEtiqueta}
                        skus={skus}
                        suggestedEndereco={suggestedEndereco}
                        finalEndereco={finalEndereco}
                        setFinalEndereco={setFinalEndereco}
                        manualAddressInput={manualAddressInput}
                        setManualAddressInput={setManualAddressInput}
                        enderecos={enderecos}
                        setErrorFeedback={setErrorFeedback}
                        isAddressScanning={isAddressScanning}
                        setIsAddressScanning={setIsAddressScanning}
                        handleManualConfirm={handleManualConfirm}
                    />
                </div>
            </div>
        </div>
    );
};

export default ArmazenagemPage;
