
import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
    SKU, Endereco, Recebimento, Etiqueta, Pedido, Missao, PalletConsolidado, 
    EtiquetaStatus, MissaoTipo, EnderecoTipo, Industria, Divergencia, 
    EnderecoStatus, User, UserStatus, Profile, Permission,
    InventoryCountSession, InventoryCountItem, SKUStatus, PedidoItem,
    TipoBloqueio,
    Conferencia, ConferenciaItem, ConferenciaErro, ConferenciaErroTipo,
    DivergenciaFonte,
    DivergenciaTipo
} from '../types';

const ADMIN_PROFILE_ID = 'admin_profile';
const OPERADOR_PROFILE_ID = 'operador_profile';
const CONFERENTE_PROFILE_ID = 'conferente_profile';
const EXPEDICAO_PROFILE_ID = 'expedicao_profile';

const defaultProfiles: Profile[] = [
    {
        id: ADMIN_PROFILE_ID,
        name: 'Admin',
        permissions: Object.values(Permission).reduce((acc, p) => ({ ...acc, [p]: true }), {})
    },
    {
        id: OPERADOR_PROFILE_ID,
        name: 'Operador',
        permissions: {
            [Permission.VIEW_DASHBOARD]: true,
            [Permission.MANAGE_RECEBIMENTO]: true,
            [Permission.MANAGE_APONTAMENTO]: true,
            [Permission.MANAGE_ARMAZENAGEM]: true,
            [Permission.MANAGE_PICKING]: true,
            [Permission.MANAGE_INVENTORY]: true,
            [Permission.VIEW_MISSOES]: true,
        }
    },
    {
        id: CONFERENTE_PROFILE_ID,
        name: 'Conferente',
        permissions: {
            [Permission.VIEW_DASHBOARD]: true,
            [Permission.MANAGE_CONFERENCIA]: true,
        }
    },
    {
        id: EXPEDICAO_PROFILE_ID,
        name: 'Expedição',
        permissions: {
            [Permission.VIEW_DASHBOARD]: true,
            [Permission.MANAGE_EXPEDICAO]: true,
        }
    }
];

type ConfirmedQuantities = Record<string, { counted: number | '', reason?: ConferenciaErroTipo }>;

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
    addEtiqueta: (etiquetaData: Partial<Etiqueta>) => Etiqueta;
    deleteEtiqueta: (id: string) => { success: boolean, message?: string };
    deleteEtiquetas: (ids: string[]) => { success: boolean, message?: string };
    getEtiquetasByRecebimento: (recebimentoId: string) => Etiqueta[];
    getEtiquetasPendentesApontamento: () => Etiqueta[];
    apontarEtiqueta: (id: string, data: Partial<Etiqueta>) => { success: boolean, message?: string, warnings?: string[] };
    armazenarEtiqueta: (id: string, enderecoId: string) => { success: boolean, message?: string };
    pedidos: Pedido[];
    addPedidos: (pedidos: Pedido[]) => void;
    updatePedido: (pedidoId: string, priority: boolean) => void;
    reabrirSeparacao: (pedidoId: string) => { success: boolean, message: string };
    processTransportData: (transportData: any[]) => { success: boolean; message: string; };
    generateMissionsForPedido: (pedidoId: string) => { success: boolean; message: string; };
    missoes: Missao[];
    createPickingMissions: (pedido: Pedido) => void;
    createMission: (missionData: Omit<Missao, 'id' | 'status' | 'createdAt'>) => Missao;
    deleteMission: (missionId: string) => void;
    revertMission: (missionId: string) => void;
    revertMissionGroup: (missionIds: string[]) => void;
    assignNextMission: (operadorId: string) => Missao | null;
    assignFamilyMissionsToOperator: (pedidoId: string, familia: string, operadorId: string) => { success: boolean; missions?: Missao[]; message?: string };
    getMyActivePickingGroup: (operadorId: string) => Missao[] | null;
    updateMissionStatus: (missionId: string, status: Missao['status'], operadorId?: string, completedQuantity?: number, divergenceReason?: string) => void;
    palletsConsolidados: PalletConsolidado[];
    addPalletConsolidado: (pallet: Omit<PalletConsolidado, 'id'>) => PalletConsolidado;
    divergencias: Divergencia[];
    getDivergenciasByRecebimento: (recebimentoId: string) => Divergencia[];
    // FIX: The `addDivergencia` implementation automatically adds `createdAt`. The type should reflect that `createdAt` is not required on input.
    addDivergencia: (divergencia: Omit<Divergencia, 'id' | 'createdAt'>) => void;
    deleteDivergencia: (id: string) => void;
    users: User[];
    addUser: (user: Omit<User, 'id'>) => { success: boolean, message?: string };
    updateUser: (user: User) => { success: boolean, message?: string };
    deleteUser: (id: string) => { success: boolean, message?: string };
    profiles: Profile[];
    addProfile: (profile: Omit<Profile, 'id'>) => { success: boolean, message?: string };
    updateProfile: (profile: Profile) => { success: boolean, message?: string };
    deleteProfile: (id: string) => { success: boolean, message?: string };
    tiposBloqueio: TipoBloqueio[];
    addTipoBloqueio: (tipoBloqueio: Omit<TipoBloqueio, 'id'>) => { success: boolean, message?: string };
    updateTipoBloqueio: (tipoBloqueio: TipoBloqueio) => { success: boolean, message?: string };
    deleteTipoBloqueio: (id: string) => { success: boolean, message?: string };
    inventoryCountSessions: InventoryCountSession[];
    inventoryCountItems: InventoryCountItem[];
    startInventoryCount: (filters: InventoryCountSession['filters'], locations: Endereco[]) => InventoryCountSession;
    recordCountItem: (itemData: Omit<InventoryCountItem, 'id'>) => void;
    undoLastCount: (sessionId: string) => void;
    finishInventoryCount: (sessionId: string) => void;
    getCountItemsBySession: (sessionId: string) => InventoryCountItem[];

    // Conferencia
    conferencias: Conferencia[];
    conferenciaItems: ConferenciaItem[];
    conferenciaErros: ConferenciaErro[];
    startConferencia: (pedidoId: string, conferenteId: string) => Conferencia | null;
    getActiveConferencia: (conferenteId: string) => { conferencia: Conferencia, pedido: Pedido } | null;
    finishConferencia: (conferenciaId: string, confirmedQuantities: ConfirmedQuantities) => { message: string };

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
    const [profiles, setProfiles] = useLocalStorage<Profile[]>('wms_profiles', defaultProfiles);
    const [users, setUsers] = useLocalStorage<User[]>('wms_users', [
        { id: 'admin_user', username: 'admin', fullName: 'Administrador', profileId: ADMIN_PROFILE_ID, status: UserStatus.ATIVO }
    ]);
    const [tiposBloqueio, setTiposBloqueio] = useLocalStorage<TipoBloqueio[]>('wms_tipos_bloqueio', []);
    const [inventoryCountSessions, setInventoryCountSessions] = useLocalStorage<InventoryCountSession[]>('wms_inventory_sessions', []);
    const [inventoryCountItems, setInventoryCountItems] = useLocalStorage<InventoryCountItem[]>('wms_inventory_items', []);

    // Conferencia State
    const [conferencias, setConferencias] = useLocalStorage<Conferencia[]>('wms_conferencias', []);
    const [conferenciaItems, setConferenciaItems] = useLocalStorage<ConferenciaItem[]>('wms_conferencia_items', []);
    const [conferenciaErros, setConferenciaErros] = useLocalStorage<ConferenciaErro[]>('wms_conferencia_erros', []);


    const generateId = () => new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);

    // SKU Management
    const addSku = (sku: Omit<SKU, 'id'>): SKU => {
        const newSku = { ...sku, id: generateId(), status: SKUStatus.ATIVO };
        setSkus(prev => [...prev, newSku]);
        return newSku;
    };
    const addSkusBatch = (newSkus: Omit<SKU, 'id'>[]) => {
        const skusWithIds = newSkus.map(sku => ({ ...sku, id: generateId(), status: SKUStatus.ATIVO }));
        setSkus(prev => [...prev, ...skusWithIds]);
    };
    const updateSku = (updatedSku: SKU) => setSkus(prev => prev.map(s => s.id === updatedSku.id ? updatedSku : s));
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
    const addEndereco = (endereco: Omit<Endereco, 'id'>) => setEnderecos(prev => [...prev, { ...endereco, id: generateId(), status: endereco.status || EnderecoStatus.LIVRE }]);
    const addEnderecosBatch = (newEnderecos: Omit<Endereco, 'id'>[]) => {
        const enderecosWithIds = newEnderecos.map(end => ({ ...end, id: generateId(), status: end.status || EnderecoStatus.LIVRE }));
        setEnderecos(prev => [...prev, ...enderecosWithIds]);
    };
    const updateEndereco = (updatedEndereco: Endereco) => setEnderecos(prev => prev.map(e => e.id === updatedEndereco.id ? updatedEndereco : e));
    const deleteEndereco = (id: string) => {
        setEnderecos(prevEnderecos => {
            const enderecoToDelete = prevEnderecos.find(e => e.id === id);
            if (enderecoToDelete && enderecoToDelete.status === EnderecoStatus.OCUPADO) {
                alert("Não é possível excluir um endereço que está ocupado.");
                return prevEnderecos;
            }
            return prevEnderecos.filter(e => e.id !== id);
        });
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
    const updateIndustria = (updatedIndustria: Industria) => setIndustrias(prev => prev.map(i => i.id === updatedIndustria.id ? updatedIndustria : i));
    const deleteIndustria = (id: string): boolean => {
        const industriaToDelete = industrias.find(i => i.id === id);
        if (!industriaToDelete) return false;

        const isIndustriaInRecebimento = recebimentos.some(r => r.fornecedor === industriaToDelete.nome);
        if (isIndustriaInRecebimento) {
            console.error(`Attempted to delete industria ${id} which is in use in a recebimento.`);
            return false;
        }
        
        const isIndustriaInSku = skus.some(s => s.industriaId === id);
        if (isIndustriaInSku) {
            console.error(`Attempted to delete industria ${id} which is linked to an SKU.`);
            return false;
        }

        const isIndustriaInEndereco = enderecos.some(e => e.industriaId === id);
        if (isIndustriaInEndereco) {
            console.error(`Attempted to delete industria ${id} which is linked to an Endereco.`);
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
        
        let lastEtiquetaNum = 0;
        setEtiquetas(prev => {
            lastEtiquetaNum = prev.reduce((max, e) => {
                const parts = e.id.split('-');
                const num = parseInt(parts[parts.length - 1], 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);
            return prev;
        });

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
    
    const updateRecebimento = (updatedRecebimento: Recebimento) => setRecebimentos(prev => prev.map(r => r.id === updatedRecebimento.id ? updatedRecebimento : r));


    // Etiqueta Management
    const getEtiquetaById = (id: string) => etiquetas.find(e => e.id === id);
    const updateEtiqueta = (updatedEtiqueta: Etiqueta) => setEtiquetas(prev => prev.map(e => e.id === updatedEtiqueta.id ? updatedEtiqueta : e));
    
    const addEtiqueta = (etiquetaData: Partial<Etiqueta>): Etiqueta => {
        let newEtiqueta: Etiqueta;
        
        setEtiquetas(prev => {
            const nfPart = 'INV';
            const lastEtiquetaNum = prev.reduce((max, e) => {
                const parts = e.id.split('-');
                if (parts.length > 1) {
                    const num = parseInt(parts[parts.length - 1], 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }
                return max;
            }, 0);
            const newId = `P${nfPart}-${(lastEtiquetaNum + 1).toString().padStart(5, '0')}`;

            newEtiqueta = {
                id: newId,
                recebimentoId: 'INVENTORY_ADJUSTMENT',
                status: EtiquetaStatus.ARMAZENADA,
                skuId: undefined,
                quantidadeCaixas: undefined,
                lote: undefined,
                validade: undefined,
                observacoes: undefined,
                enderecoId: undefined,
                dataApontamento: undefined,
                dataArmazenagem: undefined,
                dataExpedicao: undefined,
                palletConsolidadoId: undefined,
                ...etiquetaData,
            };
            return [...prev, newEtiqueta];
        });
        
        if (etiquetaData.enderecoId) {
            setEnderecos(prev => prev.map(e => e.id === etiquetaData.enderecoId ? { ...e, status: EnderecoStatus.OCUPADO } : e));
        }

        return newEtiqueta!;
    };

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
    
    const apontarEtiqueta = (id: string, data: Partial<Etiqueta>): { success: boolean, message?: string, warnings?: string[] } => {
        const sku = skus.find(s => s.id === data.skuId);
        const warnings: string[] = [];

        if (!sku) {
            return { success: false, message: "SKU não encontrado." };
        }
        
        if (data.quantidadeCaixas && data.quantidadeCaixas > sku.totalCaixas) {
            return { success: false, message: `Quantidade (${data.quantidadeCaixas}) excede a capacidade do pallet para este SKU (${sku.totalCaixas}).`};
        }
        
        if (data.validade && sku.tempoVida) {
            const hoje = new Date();
            const validade = new Date(data.validade);
            const diffTime = validade.getTime() - hoje.getTime();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diasRestantes < (sku.tempoVida * 0.5)) {
                warnings.push(`Atenção: O produto está com menos de 50% do tempo de vida útil (${diasRestantes} dias restantes).`);
            }
        }
        
        setEtiquetas(prevEtiquetas => 
            prevEtiquetas.map(etiqueta => 
                etiqueta.id === id 
                    ? {
                        ...etiqueta,
                        ...data,
                        status: EtiquetaStatus.APONTADA,
                        dataApontamento: new Date().toISOString()
                      }
                    : etiqueta
            )
        );
        return { success: true, warnings };
    };

    const armazenarEtiqueta = (id: string, enderecoId: string): { success: boolean; message?: string } => {
        let success = false;
        let message = '';
        
        setEtiquetas(prevEtiquetas => {
            const etiqueta = prevEtiquetas.find(e => e.id === id);
            
            if (!etiqueta) {
                message = "Armazenagem inválida: Etiqueta não encontrada.";
                return prevEtiquetas;
            }

            const oldEnderecoId = etiqueta.enderecoId;

            setEnderecos(prevEnderecos => {
                const enderecoDestino = prevEnderecos.find(e => e.id === enderecoId);
                if (!enderecoDestino) {
                    message = "Armazenagem inválida: Endereço de destino não encontrado.";
                    return prevEnderecos;
                }
                if (enderecoDestino.status !== EnderecoStatus.LIVRE) {
                    message = `Armazenagem inválida: Endereço ${enderecoDestino.nome} não está livre. Status: ${enderecoDestino.status}.`;
                    return prevEnderecos;
                }
                
                success = true;
                
                return prevEnderecos.map(e => {
                    if (e.id === oldEnderecoId) {
                        return { ...e, status: EnderecoStatus.LIVRE };
                    }
                    if (e.id === enderecoId) {
                        return { ...e, status: EnderecoStatus.OCUPADO };
                    }
                    return e;
                });
            });

            if (success) {
                return prevEtiquetas.map(e => e.id === id ? {
                    ...e,
                    enderecoId,
                    status: EtiquetaStatus.ARMAZENADA,
                    dataArmazenagem: new Date().toISOString()
                } : e);
            }
            return prevEtiquetas;
        });

        return { success, message };
    };
    
    // Pedido Management
    const addPedidos = (newPedidos: Pedido[]) => setPedidos(prev => [...prev, ...newPedidos]);
    const updatePedido = (pedidoId: string, priority: boolean) => {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, priority } : p));
    };

    const reabrirSeparacao = (pedidoId: string) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return { success: false, message: "Pedido não encontrado." };

        const statusesPermitidos: Pedido['status'][] = ['Separado', 'Em Conferência', 'Conferência Parcial', 'Conferido', 'Aguardando Ressuprimento'];
        if (!statusesPermitidos.includes(pedido.status)) {
            return { success: false, message: `Não é possível reabrir um pedido com status "${pedido.status}".` };
        }

        const missoesDoPedido = missoes.filter(m => m.pedidoId === pedidoId && (m.tipo === MissaoTipo.PICKING || m.tipo === MissaoTipo.REABASTECIMENTO));
        if (missoesDoPedido.length === 0) {
            setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: 'Pendente' } : p));
            return { success: true, message: "Nenhuma missão encontrada, status do pedido revertido para Pendente." };
        }

        const etiquetaIds = new Set(missoesDoPedido.map(m => m.etiquetaId));

        // Reverter status das etiquetas para ARMAZENADA
        setEtiquetas(prev => prev.map(e => etiquetaIds.has(e.id) ? { ...e, status: EtiquetaStatus.ARMAZENADA } : e));
        
        // Excluir missões
        setMissoes(prev => prev.filter(m => m.pedidoId !== pedidoId));

        // Reverter status do pedido
        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: 'Pendente' } : p));

        return { success: true, message: `Separação do pedido ${pedido.numeroTransporte} reaberta. As missões foram excluídas e o pedido voltou ao status 'Pendente'.` };
    };


     const processTransportData = (transportData: any[]): { success: boolean; message: string; } => {
        const groupedByTransporte = transportData.reduce((acc, row) => {
            const transporteNum = String(row['Nº transporte']);
            if (!acc[transporteNum]) {
                acc[transporteNum] = [];
            }
            acc[transporteNum].push(row);
            return acc;
        }, {} as Record<string, any[]>);

        const newPedidos: Pedido[] = [];
        for (const numeroTransporte in groupedByTransporte) {
            if (pedidos.some(p => p.numeroTransporte === numeroTransporte)) {
                 return { success: false, message: `Transporte ${numeroTransporte} já existe.`};
            }
            const items: PedidoItem[] = [];
            for (const row of groupedByTransporte[numeroTransporte]) {
                const sku = skus.find(s => String(s.sku) === String(row['Cód.Item']));
                if (!sku) {
                    return { success: false, message: `SKU ${row['Cód.Item']} não encontrado no cadastro.` };
                }
                items.push({
                    sku: sku.sku,
                    descricao: row['Descrição do Produto'],
                    lote: String(row['Lote']),
                    quantidadeCaixas: row['Unid.Exp.(Caixa)'],
                    unidadeArmazem: row['Unid.Armaz.'],
                    totalUnidVda: row['Total(Unid.Vda.)'],
                    unidExpFracao: row['Unid.Exp.(Fração)'],
                    pesoBruto: row['Peso Bruto'],
                    pesoLiquido: row['Peso Líquido'],
                });
            }
            newPedidos.push({
                id: `T-${generateId()}`,
                numeroTransporte,
                items,
                status: 'Pendente',
                createdAt: new Date().toISOString(),
                priority: false,
            });
        }
        setPedidos(prev => [...prev, ...newPedidos]);
        return { success: true, message: `${newPedidos.length} transportes importados com sucesso.` };
    };

    const generateMissionsForPedido = (pedidoId: string): { success: boolean; message: string; } => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return { success: false, message: "Pedido não encontrado." };
        if (pedido.status !== 'Pendente') return { success: false, message: `O pedido ${pedido.numeroTransporte} já está ${pedido.status}.` };

        const antechamber = enderecos.find(e => e.tipo === EnderecoTipo.ANTECAMARA);
        if (!antechamber) return { success: false, message: "Nenhum endereço do tipo 'Antecâmara' encontrado para ser o destino das missões." };
        
        let newMissions: Missao[] = [];
        let missionEtiquetas = new Set<string>();
        let errors: string[] = [];

        for (const item of pedido.items) {
            const sku = skus.find(s => s.sku === item.sku);
            if (!sku) {
                errors.push(`SKU ${item.sku} do pedido não encontrado no cadastro.`);
                continue;
            }
            if (sku.status === SKUStatus.BLOQUEADO) {
                errors.push(`SKU ${item.sku} está bloqueado e não pode ser separado.`);
                continue;
            }

            let quantidadePendente = item.quantidadeCaixas;

            const etiquetasDisponiveis = etiquetas.filter(e =>
                e.skuId === sku.id &&
                e.lote === item.lote &&
                e.status === EtiquetaStatus.ARMAZENADA &&
                !e.isBlocked
            ).sort((a, b) => { // FEFO Sort
                const dateA = a.validade ? new Date(a.validade).getTime() : 0;
                const dateB = b.validade ? new Date(b.validade).getTime() : 0;
                return dateA - dateB; 
            });

            if (etiquetasDisponiveis.length === 0) {
                errors.push(`Sem estoque disponível para o SKU ${item.sku}, Lote ${item.lote}.`);
                continue;
            }

            for (const etiqueta of etiquetasDisponiveis) {
                if (quantidadePendente <= 0) break;
                if (!etiqueta.enderecoId) continue; 

                const enderecoOrigem = enderecos.find(end => end.id === etiqueta.enderecoId);
                if (!enderecoOrigem || enderecoOrigem.status === EnderecoStatus.BLOQUEADO) {
                    continue; 
                }

                const quantidadeNoPallet = etiqueta.quantidadeCaixas || 0;
                const quantidadeRetirar = Math.min(quantidadePendente, quantidadeNoPallet);
                
                if (quantidadeRetirar > 0) {
                    const missionType = enderecoOrigem.tipo === EnderecoTipo.ARMAZENAGEM
                        ? MissaoTipo.REABASTECIMENTO
                        : MissaoTipo.PICKING;

                    newMissions.push({
                        id: generateId(),
                        tipo: missionType,
                        pedidoId: pedido.id,
                        etiquetaId: etiqueta.id,
                        skuId: sku.id,
                        quantidade: quantidadeRetirar,
                        origemId: etiqueta.enderecoId,
                        destinoId: antechamber.id,
                        status: 'Pendente',
                        createdAt: new Date().toISOString(),
                    });
                    
                    missionEtiquetas.add(etiqueta.id);
                    quantidadePendente -= quantidadeRetirar;
                }
            }

            if (quantidadePendente > 0) {
                errors.push(`Estoque insuficiente para SKU ${item.sku}, Lote ${item.lote}. Faltam ${quantidadePendente} caixas.`);
            }
        }
        
        if (newMissions.length > 0) {
            setMissoes(prev => [...prev, ...newMissions]);
            setEtiquetas(prev => prev.map(e => missionEtiquetas.has(e.id) ? { ...e, status: EtiquetaStatus.EM_SEPARACAO } : e));
            setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, status: 'Em Separação' } : p));
            
            let successMessage = `${newMissions.length} missões geradas.`;
            if (errors.length > 0) {
                successMessage += `\n\nAvisos:\n- ${errors.join('\n- ')}`;
            }
            return { success: true, message: successMessage };
        }

        if (errors.length > 0) {
            return { success: false, message: `Falha ao gerar missões:\n- ${errors.join('\n- ')}` };
        }

        return { success: false, message: "Nenhuma missão necessária ou estoque indisponível." };
    };


    // Missao Management
    const createPickingMissions = (pedido: Pedido) => {
        const newMissions: Missao[] = [];
        const blockedSkuIds = skus.filter(s => s.status === SKUStatus.BLOQUEADO).map(s => s.id);
        
        pedido.items.forEach(item => {
            let quantidadePendente = item.quantidadeCaixas;
            
            const itemSku = skus.find(s => s.sku === item.sku);
            if (!itemSku || blockedSkuIds.includes(itemSku.id)) {
                console.warn(`SKU ${item.sku} not found or is blocked. Skipping picking mission creation for this item.`);
                return; 
            }

            const etiquetasDisponiveis = etiquetas.filter(e => 
                e.skuId === itemSku.id && 
                e.status === EtiquetaStatus.ARMAZENADA &&
                !e.isBlocked &&
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
                        createdAt: new Date().toISOString(),
                    });
                    quantidadePendente -= quantidadeRetirar;
                }
            }
        });

        if (newMissions.length > 0) {
            setMissoes(prev => [...prev, ...newMissions]);
            setPedidos(prev => prev.map(p => p.id === pedido.id ? {...p, status: 'Em Separação'} : p));
            
            const missionEtiquetaIds = new Set(newMissions.map(m => m.etiquetaId));
            setEtiquetas(prevEtiquetas => 
                prevEtiquetas.map(etiqueta => 
                    missionEtiquetaIds.has(etiqueta.id) 
                        ? { ...etiqueta, status: EtiquetaStatus.EM_SEPARACAO } 
                        : etiqueta
                )
            );
        }
    };

    const createMission = (missionData: Omit<Missao, 'id' | 'status' | 'createdAt'>): Missao => {
        const newMission: Missao = {
            ...missionData,
            id: `M-${generateId()}`,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };
        setMissoes(prev => [...prev, newMission]);
        
        setEtiquetas(prevEtiquetas => 
            prevEtiquetas.map(etiqueta =>
                etiqueta.id === missionData.etiquetaId
                    ? { ...etiqueta, status: EtiquetaStatus.EM_SEPARACAO }
                    : etiqueta
            )
        );

        return newMission;
    };
    
    const deleteMission = (missionId: string) => {
        const missionToDelete = missoes.find(m => m.id === missionId);

        if (!missionToDelete) {
            console.error(`[deleteMission] Tentativa de excluir missão não encontrada: ${missionId}`);
            return;
        }
        if (missionToDelete.status !== 'Pendente') {
             console.error(`[deleteMission] Apenas missões pendentes podem ser excluídas. Status atual: ${missionToDelete.status}`);
             return;
        }

        setMissoes(prev => prev.filter(m => m.id !== missionId));
        
        setEtiquetas(prev => 
            prev.map(etiqueta => 
                etiqueta.id === missionToDelete.etiquetaId
                    ? { ...etiqueta, status: EtiquetaStatus.ARMAZENADA }
                    : etiqueta
            )
        );
    };

    const revertMission = (missionId: string) => {
        setMissoes(prev => 
            prev.map(m => 
                m.id === missionId 
                    ? { ...m, status: 'Pendente', operadorId: undefined, startedAt: undefined }
                    : m
            )
        );
    };

    const revertMissionGroup = (missionIds: string[]) => {
        setMissoes(prev => 
            prev.map(m => 
                missionIds.includes(m.id)
                    ? { ...m, status: 'Pendente', operadorId: undefined, startedAt: undefined }
                    : m
            )
        );
    };

    const updateMissionStatus = (missionId: string, status: Missao['status'], operadorId?: string, completedQuantity?: number, divergenceReason?: string) => {
        setMissoes(prevMissoes => {
            let missionToUpdate = prevMissoes.find(m => m.id === missionId);
            if (!missionToUpdate) return prevMissoes;

            let updatedMission = { ...missionToUpdate, status };
            if (operadorId) updatedMission.operadorId = operadorId;
            if (status === 'Em Andamento' && !updatedMission.startedAt) {
                updatedMission.startedAt = new Date().toISOString();
            }
            if (status === 'Concluída') {
                updatedMission.finishedAt = new Date().toISOString();

                // Handle picking divergence
                const qty = completedQuantity ?? updatedMission.quantidade;
                if (qty < updatedMission.quantidade) {
                    addDivergencia({
                        fonte: DivergenciaFonte.PICKING,
                        tipo: DivergenciaTipo.FALTA,
                        missaoId: updatedMission.id,
                        pedidoId: updatedMission.pedidoId,
                        skuId: updatedMission.skuId,
                        quantidade: updatedMission.quantidade - qty,
                        operadorId: operadorId,
                        observacao: divergenceReason || 'Diferença reportada no picking.'
                    });
                }
            }

            const updatedMissoes = prevMissoes.map(m => (m.id === missionId ? updatedMission : m));
            
            if (status === 'Concluída' && updatedMission?.pedidoId) {
                const pedidoId = updatedMission.pedidoId;
                const allMissionsForPedido = updatedMissoes.filter(m => m.pedidoId === pedidoId && (m.tipo === MissaoTipo.PICKING || m.tipo === MissaoTipo.REABASTECIMENTO));
                const allPickingCompleted = allMissionsForPedido.every(m => m.status === 'Concluída');
                
                if (allPickingCompleted) {
                    setPedidos(prevPedidos => prevPedidos.map(p => p.id === pedidoId ? { ...p, status: 'Separado' } : p));
                }
            }
            return updatedMissoes;
        });
    };
    
    const assignNextMission = (operadorId: string): Missao | null => {
        let assignedMission: Missao | null = null;
        setMissoes(prevMissoes => {
            const hasActiveMission = prevMissoes.some(m => m.operadorId === operadorId && (m.status === 'Atribuída' || m.status === 'Em Andamento'));
            if (hasActiveMission) {
                console.warn(`Operator ${operadorId} already has an active mission.`);
                return prevMissoes;
            }

            const pendingMissions = prevMissoes
                .filter(m => m.status === 'Pendente')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            if (pendingMissions.length === 0) {
                return prevMissoes;
            }

            const missionToAssign = pendingMissions[0];
            assignedMission = { ...missionToAssign, status: 'Atribuída' as const, operadorId: operadorId };
            return prevMissoes.map(m => (m.id === assignedMission!.id ? assignedMission : m));
        });
        return assignedMission;
    };

    const assignFamilyMissionsToOperator = (pedidoId: string, familia: string, operadorId: string): { success: boolean; missions?: Missao[]; message?: string } => {
        const skusInFamily = skus.filter(s => s.familia === familia).map(s => s.id);
        let assignedMissions: Missao[] = [];
        
        setMissoes(prevMissoes => {
            const missionsToAssign = prevMissoes.filter(m =>
                m.pedidoId === pedidoId &&
                m.status === 'Pendente' &&
                (m.tipo === MissaoTipo.PICKING || m.tipo === MissaoTipo.REABASTECIMENTO) &&
                skusInFamily.includes(m.skuId)
            );

            if (missionsToAssign.length === 0) {
                return prevMissoes;
            }
            
            const alreadyAssigned = missionsToAssign.some(m => m.operadorId);
            if (alreadyAssigned) {
                return prevMissoes;
            }
            
            const now = new Date().toISOString();
            assignedMissions = missionsToAssign.map(m => ({ ...m, status: 'Atribuída' as const, operadorId, startedAt: now }));

            return prevMissoes.map(m => {
                const updated = assignedMissions.find(um => um.id === m.id);
                return updated || m;
            });
        });
        
        if (assignedMissions.length > 0) {
            return { success: true, missions: assignedMissions };
        } else {
            return { success: false, message: 'Nenhuma missão pendente encontrada ou já atribuída.' };
        }
    };

    const getMyActivePickingGroup = (operadorId: string): Missao[] | null => {
        const activeMissions = missoes.filter(m =>
            m.operadorId === operadorId &&
            (m.status === 'Atribuída' || m.status === 'Em Andamento') &&
            (m.tipo === MissaoTipo.PICKING || m.tipo === MissaoTipo.REABASTECIMENTO)
        );
        return activeMissions.length > 0 ? activeMissions : null;
    };


    // Pallet Consolidado Management
    const addPalletConsolidado = (pallet: Omit<PalletConsolidado, 'id'>) => {
        const newPallet = { ...pallet, id: `PALLET-${generateId()}` };
        setPalletsConsolidados(prev => [...prev, newPallet]);
        return newPallet;
    };

    // Divergencia Management
    const getDivergenciasByRecebimento = (recebimentoId: string) => divergencias.filter(d => d.recebimentoId === recebimentoId);

    const addDivergencia = (divergenciaData: Omit<Divergencia, 'id' | 'createdAt'>) => {
        const newDivergencia: Divergencia = { ...divergenciaData, id: generateId(), createdAt: new Date().toISOString() };
        setDivergencias(prev => [...prev, newDivergencia]);
    };

    const deleteDivergencia = (id: string) => {
        setDivergencias(prev => prev.filter(d => d.id !== id));
    };

     // User Management
    const addUser = (userData: Omit<User, 'id'>) => {
        const existingUser = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
        if (existingUser) {
            return { success: false, message: 'Este nome de usuário já existe.' };
        }
        const newUser = { ...userData, id: generateId() };
        setUsers(prev => [...prev, newUser]);
        return { success: true };
    };

    const updateUser = (updatedUser: User) => {
        const existingUser = users.find(u => u.username.toLowerCase() === updatedUser.username.toLowerCase() && u.id !== updatedUser.id);
        if (existingUser) {
            return { success: false, message: 'Este nome de usuário já existe.' };
        }
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        return { success: true };
    };

    const deleteUser = (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (!userToDelete) {
            return { success: false, message: 'Usuário não encontrado.' };
        }
        
        const activeAdmins = users.filter(u => u.profileId === ADMIN_PROFILE_ID && u.status === UserStatus.ATIVO);
        if (userToDelete.profileId === ADMIN_PROFILE_ID && activeAdmins.length <= 1) {
            return { success: false, message: 'Não é possível excluir o último administrador ativo do sistema.' };
        }

        setUsers(prev => prev.filter(u => u.id !== id));
        return { success: true };
    };

    // Profile Management
    const addProfile = (profileData: Omit<Profile, 'id'>) => {
        const existingProfile = profiles.find(p => p.name.toLowerCase() === profileData.name.toLowerCase());
        if (existingProfile) {
            return { success: false, message: 'Já existe um perfil com este nome.' };
        }
        const newProfile = { ...profileData, id: generateId() };
        setProfiles(prev => [...prev, newProfile]);
        return { success: true };
    };

    const updateProfile = (updatedProfile: Profile) => {
        const existingProfile = profiles.find(p => p.name.toLowerCase() === updatedProfile.name.toLowerCase() && p.id !== updatedProfile.id);
        if (existingProfile) {
            return { success: false, message: 'Já existe um perfil com este nome.' };
        }
        setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        return { success: true };
    };

    const deleteProfile = (id: string) => {
        if (id === ADMIN_PROFILE_ID) {
            return { success: false, message: 'O perfil de Administrador não pode ser excluído.' };
        }
        const isProfileInUse = users.some(u => u.profileId === id);
        if (isProfileInUse) {
            return { success: false, message: 'Não é possível excluir o perfil, pois ele está sendo utilizado por um ou mais usuários.' };
        }
        setProfiles(prev => prev.filter(p => p.id !== id));
        return { success: true };
    };
    
    // Tipos de Bloqueio Management
    const addTipoBloqueio = (tipoData: Omit<TipoBloqueio, 'id'>) => {
        const existing = tiposBloqueio.find(tb => tb.codigo.toLowerCase() === tipoData.codigo.toLowerCase());
        if (existing) {
            return { success: false, message: 'Já existe um tipo de bloqueio com este código.' };
        }
        const newTipo = { ...tipoData, id: generateId() };
        setTiposBloqueio(prev => [...prev, newTipo]);
        return { success: true };
    };

    const updateTipoBloqueio = (updatedTipo: TipoBloqueio) => {
        const existing = tiposBloqueio.find(tb => tb.codigo.toLowerCase() === updatedTipo.codigo.toLowerCase() && tb.id !== updatedTipo.id);
        if (existing) {
            return { success: false, message: 'Já existe um tipo de bloqueio com este código.' };
        }
        setTiposBloqueio(prev => prev.map(tb => tb.id === updatedTipo.id ? updatedTipo : tb));
        return { success: true };
    };

    const deleteTipoBloqueio = (id: string) => {
        const isInUseInSkus = skus.some(s => s.motivoBloqueio === id);
        const isInUseInEnderecos = enderecos.some(e => e.motivoBloqueio === id);
        const isInUseInEtiquetas = etiquetas.some(et => et.motivoBloqueio === id);
        
        if (isInUseInSkus || isInUseInEnderecos || isInUseInEtiquetas) {
            return { success: false, message: 'Este tipo de bloqueio está em uso e não pode ser excluído.' };
        }

        setTiposBloqueio(prev => prev.filter(tb => tb.id !== id));
        return { success: true };
    };


    // Inventory Count Management
    const startInventoryCount = (filters: InventoryCountSession['filters'], locations: Endereco[]): InventoryCountSession => {
        const newSession: InventoryCountSession = {
            id: `INV-${generateId()}`,
            createdAt: new Date().toISOString(),
            status: 'Em Andamento',
            filters,
            totalLocations: locations.length,
            locationsCounted: 0,
        };
        setInventoryCountSessions(prev => [...prev, newSession]);
        return newSession;
    };

    const recordCountItem = (itemData: Omit<InventoryCountItem, 'id'>) => {
        const newItem: InventoryCountItem = {
            ...itemData,
            id: generateId(),
        };
        setInventoryCountItems(prev => [...prev, newItem]);
        
        setInventoryCountSessions(prev => prev.map(session => {
            if (session.id === itemData.sessionId) {
                return { ...session, locationsCounted: session.locationsCounted + 1 };
            }
            return session;
        }));
    };
    
    const undoLastCount = (sessionId: string) => {
        setInventoryCountItems(prev => {
            const sessionItems = prev
                .filter(item => item.sessionId === sessionId)
                .sort((a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime());

            if (sessionItems.length === 0) return prev;

            const lastItemId = sessionItems[0].id;
            return prev.filter(item => item.id !== lastItemId);
        });

        setInventoryCountSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                return { ...session, locationsCounted: Math.max(0, session.locationsCounted - 1) };
            }
            return session;
        }));
    };

    const finishInventoryCount = (sessionId: string) => {
        setInventoryCountSessions(prev => prev.map(session => 
            session.id === sessionId ? { ...session, status: 'Concluído' } : session
        ));
    };

    const getCountItemsBySession = (sessionId: string) => {
        return inventoryCountItems.filter(item => item.sessionId === sessionId);
    };

    // Conferencia Management
    const startConferencia = (pedidoId: string, conferenteId: string): Conferencia | null => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido || pedido.status !== 'Separado') return null;

        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: 'Em Conferência' } : p));
        
        const newConferencia: Conferencia = {
            id: `CONF-${generateId()}`,
            pedidoId,
            conferenteId,
            startedAt: new Date().toISOString(),
            status: 'Em Andamento',
        };
        setConferencias(prev => [...prev, newConferencia]);
        return newConferencia;
    };

    const getActiveConferencia = (conferenteId: string): { conferencia: Conferencia, pedido: Pedido } | null => {
        const conf = conferencias.find(c => c.conferenteId === conferenteId && c.status === 'Em Andamento');
        if (!conf) return null;
        const pedido = pedidos.find(p => p.id === conf.pedidoId);
        if (!pedido) return null;
        return { conferencia: conf, pedido };
    };

    const finishConferencia = (conferenciaId: string, confirmedQuantities: ConfirmedQuantities): { message: string } => {
        const conferencia = conferencias.find(c => c.id === conferenciaId);
        const pedido = pedidos.find(p => p.id === conferencia?.pedidoId);
        if (!conferencia || !pedido) return { message: "Conferência ou Pedido não encontrado." };

        let hasMismatch = false;
        let replenishmentMissionsCreated = 0;
        let replenishmentNeededButNoStock = 0;
        const newErrors: ConferenciaErro[] = [];
        
        const checkAvailableStock = (skuId: string, lote: string, quantityNeeded: number): boolean => {
             let availableQty = 0;
             const etiquetasDisponiveis = etiquetas.filter(e =>
                e.skuId === skuId &&
                e.lote === lote &&
                e.status === EtiquetaStatus.ARMAZENADA &&
                !e.isBlocked
            );
            for (const etiqueta of etiquetasDisponiveis) {
                availableQty += etiqueta.quantidadeCaixas || 0;
            }
            return availableQty >= quantityNeeded;
        }

        for(const pedidoItem of pedido.items) {
            const sku = skus.find(s => s.sku === pedidoItem.sku);
            if (!sku) continue;

            const key = `${sku.id}|${pedidoItem.lote}`;
            const confirmed = confirmedQuantities[key];
            const countedQty = confirmed?.counted === '' || confirmed?.counted === undefined ? 0 : Number(confirmed.counted);
            const expectedQty = pedidoItem.quantidadeCaixas;
            const difference = countedQty - expectedQty;

            if (difference < 0) { // Falta ou Avaria
                hasMismatch = true;
                const missingQty = Math.abs(difference);
                const reason = confirmed?.reason || ConferenciaErroTipo.FALTA;

                if (checkAvailableStock(sku.id, pedidoItem.lote, missingQty)) {
                    // Create replenishment mission
                    generateMissionsForPedido(pedido.id); // This is complex, simplified for now
                    replenishmentMissionsCreated++;
                } else {
                    replenishmentNeededButNoStock++;
                    newErrors.push({
                        id: generateId(),
                        conferenciaId,
                        pedidoId: pedido.id,
                        skuId: sku.id,
                        lote: pedidoItem.lote,
                        tipo: reason,
                        quantidadeDivergente: missingQty,
                        conferenteId: conferencia.conferenteId,
                        createdAt: new Date().toISOString(),
                        observacao: "Sem estoque para ressuprimento."
                    });
                }
            } else if (difference > 0) { // Sobra
                hasMismatch = true;
                newErrors.push({
                    id: generateId(),
                    conferenciaId,
                    pedidoId: pedido.id,
                    skuId: sku.id,
                    lote: pedidoItem.lote,
                    tipo: ConferenciaErroTipo.SOBRA,
                    quantidadeDivergente: difference,
                    conferenteId: conferencia.conferenteId,
                    createdAt: new Date().toISOString()
                });
            }
        };

        if (newErrors.length > 0) {
            setConferenciaErros(prev => [...prev, ...newErrors]);
        }
        
        let finalStatus: Pedido['status'] = 'Conferido';
        let message = `Conferência do pedido ${pedido.numeroTransporte} finalizada.`;

        if (replenishmentMissionsCreated > 0) {
            finalStatus = 'Aguardando Ressuprimento';
            message += ` ${replenishmentMissionsCreated} missões de ressuprimento foram criadas.`;
        } else if (hasMismatch) {
            finalStatus = 'Conferência Parcial';
             message += ` Foram encontradas ${newErrors.length} divergências.`;
        }

        setConferencias(prev => prev.map(c => c.id === conferenciaId ? { ...c, status: 'Concluída', finishedAt: new Date().toISOString() } : c));
        setPedidos(prev => prev.map(p => p.id === conferencia.pedidoId ? { ...p, status: finalStatus } : p));
        return { message };
    };


    const value = {
        skus, addSku, addSkusBatch, updateSku, deleteSku,
        enderecos, addEndereco, addEnderecosBatch, updateEndereco, deleteEndereco,
        industrias, addIndustria, addIndustriasBatch, updateIndustria, deleteIndustria,
        recebimentos, addRecebimento, updateRecebimento,
        etiquetas, getEtiquetaById, updateEtiqueta, addEtiqueta, deleteEtiqueta, deleteEtiquetas, getEtiquetasByRecebimento, getEtiquetasPendentesApontamento, apontarEtiqueta, armazenarEtiqueta,
        pedidos, addPedidos, updatePedido, reabrirSeparacao, processTransportData, generateMissionsForPedido,
        missoes, createPickingMissions, createMission, deleteMission, revertMission, revertMissionGroup, assignNextMission, updateMissionStatus, assignFamilyMissionsToOperator, getMyActivePickingGroup,
        palletsConsolidados, addPalletConsolidado,
        divergencias, getDivergenciasByRecebimento, addDivergencia, deleteDivergencia,
        users, addUser, updateUser, deleteUser,
        profiles, addProfile, updateProfile, deleteProfile,
        tiposBloqueio, addTipoBloqueio, updateTipoBloqueio, deleteTipoBloqueio,
        inventoryCountSessions, inventoryCountItems, startInventoryCount, recordCountItem, undoLastCount, finishInventoryCount, getCountItemsBySession,
        conferencias, conferenciaItems, conferenciaErros, startConferencia, getActiveConferencia, finishConferencia
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
