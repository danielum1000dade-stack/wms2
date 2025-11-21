
import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { SKU, Endereco, Recebimento, Etiqueta, Pedido, Missao, PalletConsolidado, EtiquetaStatus, MissaoTipo, EnderecoTipo, Industria, Divergencia, DivergenciaTipo, EnderecoStatus } from '../types';

interface WMSContextType {
    skus: SKU[];
    addSku: (sku: Omit<SKU, 'id'>) => SKU;
    addSkusBatch: (skus: Omit<SKU, 'id'>[]) => void;
    updateSku: (sku: SKU) => void;
    deleteSku: (id: string) => boolean;
    enderecos: Endereco[];
    addEndereco: (endereco: Omit<Endereco, 'id'>) => void;
    addEnderecosBatch: (enderecos: Omit<Endereco, 'id'>[]) => void;
    updateEndereco: (endereco: Endereco) => void;
    deleteEndereco: (id: string) => void;
    industrias: Industria[];
    addIndustria: (industria: Omit<Industria, 'id'>) => Industria;
    addIndustriasBatch: (industrias: Omit<Industria, 'id'>[]) => void;
    updateIndustria: (industria: Industria) => void;
    deleteIndustria: (id: string) => boolean;
    recebimentos: Recebimento[];
    addRecebimento: (recebimentoData: Omit<Recebimento, 'id'>, etiquetasCount: number) => { newRecebimento: Recebimento, newEtiquetas: Etiqueta[] };
    updateRecebimento: (recebimento: Recebimento) => void;
    etiquetas: Etiqueta[];
    getEtiquetaById: (id: string) => Etiqueta | undefined;
    updateEtiqueta: (etiqueta: Etiqueta) => void;
    deleteEtiqueta: (id: string) => { success: boolean, message?: string };
    deleteEtiquetas: (ids: string[]) => { success: boolean, message?: string };
    getEtiquetasByRecebimento: (recebimentoId: string) => Etiqueta[];
    getEtiquetasPendentesApontamento: () => Etiqueta[];
    apontarEtiqueta: (id: string, data: Partial<Etiqueta>) => void;
    armazenarEtiqueta: (id: string, enderecoId: string) => void;
    pedidos: Pedido[];
    addPedidos: (pedidos: Pedido[]) => void;
    missoes: Missao[];
    createPickingMissions: (pedido: Pedido) => void;
    palletsConsolidados: PalletConsolidado[];
    addPalletConsolidado: (pallet: Omit<PalletConsolidado, 'id'>) => PalletConsolidado;
    divergencias: Divergencia[];
    getDivergenciasByRecebimento: (recebimentoId: string) => Divergencia[];
    addDivergencia: (divergencia: Omit<Divergencia, 'id'>) => void;
    deleteDivergencia: (id: string) => void;
}

const WMSContext = createContext<WMSContextType | undefined>(undefined);

export const WMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [skus, setSkus] = useLocalStorage<SKU[]>('wms_skus', []);
    const [enderecos, setEnderecos] = useLocalStorage<Endereco[]>('wms_enderecos', []);
    const [recebimentos, setRecebimentos] = useLocalStorage<Recebimento[]>('wms_recebimentos', []);
    const [etiquetas, setEtiquetas] = useLocalStorage<Etiqueta[]>('wms_etiquetas', []);
    const [pedidos, setPedidos] = useLocalStorage<Pedido[]>('wms_pedidos', []);
    const [missoes, setMissoes] = useLocalStorage<Missao[]>('wms_missoes', []);
    const [palletsConsolidados, setPalletsConsolidados] = useLocalStorage<PalletConsolidado[]>('wms_pallets_consolidados', []);
    const [industrias, setIndustrias] = useLocalStorage<Industria[]>('wms_industrias', []);
    const [divergencias, setDivergencias] = useLocalStorage<Divergencia[]>('wms_divergencias', []);

    const generateId = () => new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);

    // SKU Management
    const addSku = (sku: Omit<SKU, 'id'>): SKU => {
        const newSku = { ...sku, id: generateId() };
        setSkus(prev => [...prev, newSku]);
        return newSku;
    };
    const addSkusBatch = (newSkus: Omit<SKU, 'id'>[]) => {
        const skusWithIds = newSkus.map(sku => ({ ...sku, id: generateId() }));
        setSkus(prev => [...prev, ...skusWithIds]);
    };
    const updateSku = (updatedSku: SKU) => setSkus(skus.map(s => s.id === updatedSku.id ? updatedSku : s));
    const deleteSku = (id: string): boolean => {
        const isSkuInUse = etiquetas.some(etiqueta => etiqueta.skuId === id);
        if (isSkuInUse) {
            console.error(`Attempted to delete SKU ${id} which is in use.`);
            return false;
        }
        setSkus(prevSkus => prevSkus.filter(s => s.id !== id));
        return true;
    };

    // Endereco Management
    const addEndereco = (endereco: Omit<Endereco, 'id'>) => setEnderecos([...enderecos, { ...endereco, id: generateId(), status: endereco.status || EnderecoStatus.LIVRE }]);
    const addEnderecosBatch = (newEnderecos: Omit<Endereco, 'id'>[]) => {
        const enderecosWithIds = newEnderecos.map(end => ({ ...end, id: generateId(), status: end.status || EnderecoStatus.LIVRE }));
        setEnderecos(prev => [...prev, ...enderecosWithIds]);
    };
    const updateEndereco = (updatedEndereco: Endereco) => setEnderecos(enderecos.map(e => e.id === updatedEndereco.id ? updatedEndereco : e));
    const deleteEndereco = (id: string) => {
        const enderecoToDelete = enderecos.find(e => e.id === id);
        if (enderecoToDelete && enderecoToDelete.status === EnderecoStatus.OCUPADO) {
            alert("Não é possível excluir um endereço que está ocupado.");
            return;
        }
        setEnderecos(enderecos.filter(e => e.id !== id));
    };

    // Industria Management
    const addIndustria = (industria: Omit<Industria, 'id'>): Industria => {
        const newIndustria = { ...industria, id: generateId() };
        setIndustrias(prev => [...prev, newIndustria]);
        return newIndustria;
    };
     const addIndustriasBatch = (newIndustrias: Omit<Industria, 'id'>[]) => {
        const industriasWithIds = newIndustrias.map(ind => ({ ...ind, id: generateId() }));
        setIndustrias(prev => [...prev, ...industriasWithIds]);
    };
    const updateIndustria = (updatedIndustria: Industria) => setIndustrias(industrias.map(i => i.id === updatedIndustria.id ? updatedIndustria : i));
    const deleteIndustria = (id: string): boolean => {
        const industriaToDelete = industrias.find(i => i.id === id);
        if (!industriaToDelete) return false;

        const isIndustriaInUse = recebimentos.some(r => r.fornecedor === industriaToDelete.nome);
        if (isIndustriaInUse) {
            console.error(`Attempted to delete industria ${id} which is in use.`);
            return false;
        }
        setIndustrias(prev => prev.filter(i => i.id !== id));
        return true;
    };


    // Recebimento Management
    const addRecebimento = (
        recebimentoData: Omit<Recebimento, 'id'>, 
        etiquetasCount: number
    ) => {
        const newRecebimento = { ...recebimentoData, id: generateId(), houveAvarias: false };
        
        const nfPart = newRecebimento.notaFiscal.replace(/\D/g, '').slice(-4) || '0000';
        
        const lastEtiquetaNum = etiquetas.reduce((max, e) => {
            const parts = e.id.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);

        const newEtiquetas: Etiqueta[] = Array.from({ length: etiquetasCount }, (_, i) => {
             const newId = `P${nfPart}-${(lastEtiquetaNum + i + 1).toString().padStart(5, '0')}`;
             return {
                id: newId,
                recebimentoId: newRecebimento.id,
                status: EtiquetaStatus.PENDENTE_APONTAMENTO,
            };
        });

        setRecebimentos(prev => [...prev, newRecebimento]);
        setEtiquetas(prev => [...prev, ...newEtiquetas]);

        return { newRecebimento, newEtiquetas };
    };
    
    const updateRecebimento = (updatedRecebimento: Recebimento) => setRecebimentos(recebimentos.map(r => r.id === updatedRecebimento.id ? updatedRecebimento : r));


    // Etiqueta Management
    const getEtiquetaById = (id: string) => etiquetas.find(e => e.id === id);
    const updateEtiqueta = (updatedEtiqueta: Etiqueta) => setEtiquetas(etiquetas.map(e => e.id === updatedEtiqueta.id ? updatedEtiqueta : e));
    
    const deleteEtiqueta = (id: string): { success: boolean; message?: string } => {
        const etiqueta = etiquetas.find((e) => e.id === id);
        if (!etiqueta) {
            return { success: false, message: 'Etiqueta não encontrada.' };
        }
        if (etiqueta.status !== EtiquetaStatus.PENDENTE_APONTAMENTO) {
            return { success: false, message: `A etiqueta ${id} não pode ser excluída, pois seu status é "${etiqueta.status}".` };
        }
        setEtiquetas((prev) => prev.filter((e) => e.id !== id));
        return { success: true };
    };
    
    const deleteEtiquetas = (ids: string[]): { success: boolean; message?: string } => {
        const etiquetasToDelete = etiquetas.filter(e => ids.includes(e.id));
        if (etiquetasToDelete.length !== ids.length) {
            return { success: false, message: "Erro: Algumas etiquetas na lista para exclusão não foram encontradas no sistema." };
        }
    
        const nonDeletableEtiqueta = etiquetasToDelete.find(e => e.status !== EtiquetaStatus.PENDENTE_APONTAMENTO);
        if (nonDeletableEtiqueta) {
            return { success: false, message: `A etiqueta ${nonDeletableEtiqueta.id} não pode ser excluída, pois seu status é "${nonDeletableEtiqueta.status}".` };
        }
    
        setEtiquetas((prev) => prev.filter((e) => !ids.includes(e.id)));
        return { success: true };
    };

    const getEtiquetasByRecebimento = (recebimentoId: string) => etiquetas.filter(e => e.recebimentoId === recebimentoId);
    const getEtiquetasPendentesApontamento = () => etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO);
    const apontarEtiqueta = (id: string, data: Partial<Etiqueta>) => {
        const etiqueta = getEtiquetaById(id);
        if (etiqueta) {
            updateEtiqueta({
                ...etiqueta,
                ...data,
                status: EtiquetaStatus.APONTADA,
                dataApontamento: new Date().toISOString()
            });
        }
    };

    const armazenarEtiqueta = (id: string, enderecoId: string) => {
        const etiqueta = getEtiquetaById(id);
        const enderecoDestino = enderecos.find(e => e.id === enderecoId);

        if (!etiqueta || !enderecoDestino || enderecoDestino.status !== EnderecoStatus.LIVRE) {
            console.error("Armazenagem inválida: Etiqueta ou endereço não encontrado, ou endereço não está livre.", { etiqueta, enderecoDestino });
            return;
        }

        setEnderecos(prevEnderecos => {
            let newEnderecos = [...prevEnderecos];
            // Free up old address if it exists
            if (etiqueta.enderecoId) {
                const oldEnderecoIndex = newEnderecos.findIndex(e => e.id === etiqueta.enderecoId);
                if (oldEnderecoIndex > -1) {
                    newEnderecos[oldEnderecoIndex] = { ...newEnderecos[oldEnderecoIndex], status: EnderecoStatus.LIVRE };
                }
            }
            // Occupy new address
            const newEnderecoIndex = newEnderecos.findIndex(e => e.id === enderecoId);
            if (newEnderecoIndex > -1) {
                newEnderecos[newEnderecoIndex] = { ...newEnderecos[newEnderecoIndex], status: EnderecoStatus.OCUPADO };
            }
            return newEnderecos;
        });
        
        updateEtiqueta({
            ...etiqueta,
            enderecoId,
            status: EtiquetaStatus.ARMAZENADA,
            dataArmazenagem: new Date().toISOString()
        });
    };
    
    // Pedido Management
    const addPedidos = (newPedidos: Pedido[]) => setPedidos([...pedidos, ...newPedidos]);

    // Missao Management
    const createPickingMissions = (pedido: Pedido) => {
        const newMissions: Missao[] = [];
        
        pedido.items.forEach(item => {
            let quantidadePendente = item.quantidadeCaixas;
            
            const etiquetasDisponiveis = etiquetas.filter(e => 
                e.skuId === skus.find(s => s.sku === item.sku)?.id && 
                e.status === EtiquetaStatus.ARMAZENADA &&
                e.lote === item.lote
            ).sort((a,b) => (a.quantidadeCaixas ?? 0) - (b.quantidadeCaixas ?? 0));

            for(const etiqueta of etiquetasDisponiveis) {
                if(quantidadePendente <= 0) break;

                const quantidadeRetirar = Math.min(quantidadePendente, etiqueta.quantidadeCaixas ?? 0);

                if (quantidadeRetirar > 0 && etiqueta.enderecoId && etiqueta.skuId) {
                     newMissions.push({
                        id: generateId(),
                        tipo: MissaoTipo.PICKING,
                        pedidoId: pedido.id,
                        etiquetaId: etiqueta.id,
                        skuId: etiqueta.skuId,
                        quantidade: quantidadeRetirar,
                        origemId: etiqueta.enderecoId,
                        destinoId: enderecos.find(e => e.tipo === EnderecoTipo.ANTECAMARA)?.id || 'N/A',
                        status: 'Pendente',
                    });
                    quantidadePendente -= quantidadeRetirar;
                }
            }
        });

        if (newMissions.length > 0) {
            setMissoes([...missoes, ...newMissions]);
            setPedidos(pedidos.map(p => p.id === pedido.id ? {...p, status: 'Em Separação'} : p));
        }
    };
    
    // Pallet Consolidado Management
    const addPalletConsolidado = (pallet: Omit<PalletConsolidado, 'id'>) => {
        const newPallet = { ...pallet, id: `PALLET-${generateId()}` };
        setPalletsConsolidados([...palletsConsolidados, newPallet]);
        return newPallet;
    };

    // Divergencia Management
    const getDivergenciasByRecebimento = (recebimentoId: string) => divergencias.filter(d => d.recebimentoId === recebimentoId);

    const addDivergencia = (divergenciaData: Omit<Divergencia, 'id'>) => {
        const newDivergencia = { ...divergenciaData, id: generateId() };
        setDivergencias(prev => [...prev, newDivergencia]);
    };

    const deleteDivergencia = (id: string) => {
        setDivergencias(prev => prev.filter(d => d.id !== id));
    };

    const value = {
        skus, addSku, addSkusBatch, updateSku, deleteSku,
        enderecos, addEndereco, addEnderecosBatch, updateEndereco, deleteEndereco,
        industrias, addIndustria, addIndustriasBatch, updateIndustria, deleteIndustria,
        recebimentos, addRecebimento, updateRecebimento,
        etiquetas, getEtiquetaById, updateEtiqueta, deleteEtiqueta, deleteEtiquetas, getEtiquetasByRecebimento, getEtiquetasPendentesApontamento, apontarEtiqueta, armazenarEtiqueta,
        pedidos, addPedidos,
        missoes, createPickingMissions,
        palletsConsolidados, addPalletConsolidado,
        divergencias, getDivergenciasByRecebimento, addDivergencia, deleteDivergencia
    };

    return <WMSContext.Provider value={value}>{children}</WMSContext.Provider>;
};

export const useWMS = () => {
    const context = useContext(WMSContext);
    if (context === undefined) {
        throw new Error('useWMS must be used within a WMSProvider');
    }
    return context;
};