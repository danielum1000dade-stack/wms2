import React, { useState, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { Etiqueta, Endereco, SKU, EtiquetaStatus, EnderecoTipo, EnderecoStatus } from '../types';
import { CameraIcon, CheckCircleIcon, LightBulbIcon, MapPinIcon, XCircleIcon } from '@heroicons/react/24/outline';

declare const Html5QrcodeScanner: any;

const ArmazenagemPage: React.FC = () => {
    const { etiquetas, enderecos, skus, armazenarEtiqueta } = useWMS();
    
    const [palletsParaArmazenar, setPalletsParaArmazenar] = useState<Etiqueta[]>([]);
    const [selectedEtiqueta, setSelectedEtiqueta] = useState<Etiqueta | null>(null);
    const [suggestedEndereco, setSuggestedEndereco] = useState<Endereco | null>(null);
    const [manualEndereco, setManualEndereco] = useState<Endereco | null>(null);
    const [finalEndereco, setFinalEndereco] = useState<Endereco | null>(null);
    
    const [palletIdInput, setPalletIdInput] = useState('');
    const [isPalletScanning, setIsPalletScanning] = useState(false);
    const [isAddressScanning, setIsAddressScanning] = useState(false);
    
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const scannerRef = useRef<any>(null);
    const palletCardRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

    useEffect(() => {
        setPalletsParaArmazenar(etiquetas.filter(e => e.status === EtiquetaStatus.APONTADA));
    }, [etiquetas]);

    const findSuggestedAddress = (sku: SKU): Endereco | null => {
        const enderecosDisponiveis = enderecos.filter(e => 
            e.status === EnderecoStatus.LIVRE && 
            e.tipo === EnderecoTipo.ARMAZENAGEM
        );

        if (enderecosDisponiveis.length === 0) return null;

        const skuSres = [sku.sre1, sku.sre2, sku.sre3, sku.sre4, sku.sre5].filter(Boolean);
        
        // Se o SKU tem SREs, procure um endereço compatível
        if (skuSres.length > 0) {
            const enderecosCompativeis = enderecosDisponiveis.filter(e => {
                const endSres = [e.sre1, e.sre2, e.sre3, e.sre4, e.sre5].filter(Boolean);
                if (endSres.length === 0) return false; // Endereço sem SRE não é compatível com SKU que exige SRE
                return skuSres.some(sre => endSres.includes(sre));
            });
            if (enderecosCompativeis.length > 0) {
                // Poderia ter uma lógica mais complexa aqui (ex: o que tem menos pallets), mas por agora o primeiro está bom
                return enderecosCompativeis[0];
            }
        }
        
        // Se SKU não tem SRE (ou não achou compatível), procure um endereço "genérico" (sem SRE)
        const enderecosGenericos = enderecosDisponiveis.filter(e => {
            const endSres = [e.sre1, e.sre2, e.sre3, e.sre4, e.sre5].filter(Boolean);
            return endSres.length === 0;
        });

        if (enderecosGenericos.length > 0) {
            return enderecosGenericos[0];
        }

        // Como último recurso, se o SKU não tem SRE, retorne qualquer endereço livre
        if (skuSres.length === 0) {
            return enderecosDisponiveis[0];
        }
        
        return null; // Nenhuma sugestão encontrada
    };

    const handleSelectEtiqueta = (etiqueta: Etiqueta) => {
        resetState(true); // Keep pallet selection UI
        setSelectedEtiqueta(etiqueta);
        setPalletIdInput(etiqueta.id);

        // Scroll to the selected pallet in the list
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
        setManualEndereco(null);
        setFinalEndereco(null);
        setIsAddressScanning(false);
        setIsPalletScanning(false);
        setFeedback(null);
    }

    const handleFindPallet = (id: string) => {
        if (!id) return;
        const pallet = palletsParaArmazenar.find(e => e.id.toLowerCase() === id.toLowerCase());
        if (pallet) {
            handleSelectEtiqueta(pallet);
            setFeedback(null);
        } else {
            resetState();
            setFeedback({ type: 'error', message: 'Pallet não encontrado ou não está aguardando armazenagem.' });
        }
    };
    
    // Pallet Scanner Logic
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

    // Address Scanner Logic
    useEffect(() => {
        if (isAddressScanning && finalEndereco) {
            scannerRef.current = new Html5QrcodeScanner("address-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scannerRef.current.render(onAddressScanSuccess, () => {});
        } else if (scannerRef.current?.getState() !== 1) { // 1 = NOT_STARTED
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

        if (decodedText === finalEndereco.codigo) {
            armazenarEtiqueta(selectedEtiqueta.id, finalEndereco.id);
            setFeedback({ type: 'success', message: `Pallet ${selectedEtiqueta.id} armazenado em ${finalEndereco.nome} com sucesso!`});
            setTimeout(resetState, 2000);
        } else {
            setFeedback({ type: 'error', message: `Endereço incorreto! Escaneado: ${decodedText}. Esperado: ${finalEndereco.codigo}.`});
        }
        setIsAddressScanning(false);
    };

    const PalletCard: React.FC<{ etiqueta: Etiqueta }> = ({ etiqueta }) => {
        const sku = skus.find(s => s.id === etiqueta.skuId);
        return (
            <div 
                ref={el => palletCardRefs.current[etiqueta.id] = el}
                onClick={() => handleSelectEtiqueta(etiqueta)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedEtiqueta?.id === etiqueta.id ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-300' : 'bg-white hover:bg-gray-50'}`}
            >
                <p className="font-mono font-bold text-gray-800">{etiqueta.id}</p>
                <p className="text-sm text-gray-600">{sku?.sku} - {sku?.descritivo}</p>
                <p className="text-xs text-gray-500">Qtd: {etiqueta.quantidadeCaixas} | Lote: {etiqueta.lote}</p>
            </div>
        );
    }

    const ActionPanel: React.FC = () => {
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
                    <button
                        onClick={() => setIsAddressScanning(!isAddressScanning)}
                        className={`w-full flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg shadow-md transition-colors ${isAddressScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isAddressScanning ? <XCircleIcon className="h-6 w-6 mr-2"/> : <CameraIcon className="h-6 w-6 mr-2"/>}
                        {isAddressScanning ? 'Cancelar Leitura' : 'Escanear Endereço para Confirmar'}
                    </button>
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
                    <h4 className="font-semibold flex items-center text-yellow-800"><LightBulbIcon className="h-5 w-5 mr-2"/> Endereço Sugerido</h4>
                    {suggestedEndereco ? (
                        <>
                            <p className="text-xl font-bold text-gray-800 my-2">{suggestedEndereco.nome}</p>
                            <button onClick={() => setFinalEndereco(suggestedEndereco)} className="w-full bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-500">
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
                    <input 
                        type="text"
                        placeholder="Ex: A01-01-A"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                        onBlur={(e) => {
                            const found = enderecos.find(end => end.codigo.toLowerCase() === e.target.value.toLowerCase());
                            if (found) {
                                if (found.status !== EnderecoStatus.LIVRE) {
                                    setFeedback({type: 'error', message: `Endereço "${found.codigo}" está ${found.status}!`});
                                    setManualEndereco(null);
                                } else {
                                    setManualEndereco(found);
                                    setFeedback(null);
                                }
                            } else if (e.target.value) {
                                setFeedback({type: 'error', message: 'Endereço não encontrado.'});
                                setManualEndereco(null);
                            }
                        }}
                    />
                    {manualEndereco && (
                        <button onClick={() => setFinalEndereco(manualEndereco)} className="mt-2 w-full bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600">
                           Confirmar Endereço Manual: {manualEndereco.nome}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Armazenagem de Pallets</h1>
            
            {feedback && (
                <div className={`p-4 rounded-md ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.message}
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
                    <ActionPanel/>
                </div>
            </div>
        </div>
    );
};

export default ArmazenagemPage;