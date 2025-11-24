
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
    DivergenciaTipo,
    AuditLog, AuditActionType
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

interface PickingConfig {
    allowPickingFromAnyAddress: boolean;
}

interface AppConfig {
    replenishmentThreshold: number; // Percentage
}

// IA Engine: Suggested Address Return Type
interface IASuggestion {
    endereco: Endereco;
    score: number;
    reason: string;
}

interface WMSContextType {
    skus: SKU[];
    addSku: (sku: Omit<SKU, 'id'>) => SKU;
    addSkusBatch: (skus: Omit<SKU, 'id'>[]) => void;
    updateSku: (sku: SKU) => void;
    deleteSku: (id: string) => boolean;
    calculateAndApplyABCClassification: () => { success: boolean, message: string };
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
    updateRecebimento: (recebimento: Recebimento) => Promise<void>;
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
    getBestPutawayAddress: (etiqueta: Etiqueta) => IASuggestion | null; // IA Feature
    pedidos: Pedido[];
    addPedidos: (pedidos: Pedido[]) => void;
    updatePedido: (pedidoId: string, data: Partial<Omit<Pedido, 'id'>>) => void;
    reabrirSeparacao: (pedidoId: string, motivo: string) => { success: boolean, message: string };
    processTransportData: (transportData: any[]) => Promise<{ success: boolean; message: string; }>;
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
    updateMissionStatus: (missionId: string, status: Missao['status'], operadorId?: string, completedQuantity?: number, divergenceReason?: string, observation?: string) => void;
    palletsConsolidados: PalletConsolidado[];
    addPalletConsolidado: (pallet: Omit<PalletConsolidado, 'id'>) => PalletConsolidado;
    divergencias: Divergencia[];
    getDivergenciasByRecebimento: (recebimentoId: string) => Divergencia[];
    addDivergencia: (divergencia: Omit<Divergencia, 'id' | 'createdAt'>) => Promise<void>;
    deleteDivergencia: (id: string) => Promise<void>;
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

    // Logs & Configs
    auditLogs: AuditLog[];
    logEvent: (actionType: AuditActionType, entity: AuditLog['entity'], entityId: string, details: string, metadata?: any) => void;
    pickingConfig: PickingConfig;
    setPickingConfig: React.Dispatch<React.SetStateAction<PickingConfig>>;
    appConfig: AppConfig;
    setAppConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
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
    const [auditLogs, setAuditLogs] = useLocalStorage<AuditLog[]>('wms_audit_logs', []);

    const [pickingConfig, setPickingConfig] = useLocalStorage<PickingConfig>('wms_picking_config', {
        allowPickingFromAnyAddress: false
    });

    const [appConfig, setAppConfig] = useLocalStorage<AppConfig>('wms_app_config', {
        replenishmentThreshold: 25, // Default to 25%
    });

    // Conferencia State
    const [conferencias, setConferencias] = useLocalStorage<Conferencia[]>('wms_conferencias', []);
    const [conferenciaItems, setConferenciaItems] = useLocalStorage<ConferenciaItem[]>('wms_conferencia_items', []);
    const [conferenciaErros, setConferenciaErros] = useLocalStorage<ConferenciaErro[]>('wms_conferencia_erros', []);


    const generateId = () => new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);
    const currentUserId = 'admin_user'; // Simulating logged in user

    // --- AUDIT LOGGING SYSTEM ---
    const logEvent = (
        actionType: AuditActionType, 
        entity: AuditLog['entity'], 
        entityId: string, 
        details: string, 
        metadata?: any
    ) => {
        const newLog: AuditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUserId,
            userName: users.find(u => u.id === currentUserId)?.fullName || 'Sistema',
            actionType,
            entity,
            entityId,
            details,
            metadata
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    // SKU Management
    const addSku = (sku: Omit<SKU, 'id'>): SKU => {
        const newSku = { ...sku, id: generateId(), status: SKUStatus.ATIVO };
        setSkus(prev => [...prev, newSku]);
        logEvent(AuditActionType.CREATE, 'SKU', newSku.id, `SKU ${newSku.sku} criado.`);
        return newSku;
    };
    const addSkusBatch = (newSkus: Omit<SKU, 'id'>[]) => {
        const skusWithIds = newSkus.map(sku => ({ ...sku, id: generateId(), status: SKUStatus.ATIVO }));
        setSkus(prev => [...prev, ...skusWithIds]);
        logEvent(AuditActionType.CREATE, 'SKU', 'BATCH', `Importação em lote de ${newSkus.length} SKUs.`);
    };
    const updateSku = (updatedSku: SKU) => {
        setSkus(prev => prev.map(s => s.id === updatedSku.id ? updatedSku : s));
        logEvent(AuditActionType.UPDATE, 'SKU', updatedSku.id, `SKU ${updatedSku.sku} atualizado.`);
    };
    const deleteSku = (id: string): boolean => {
        const isSkuInUse = etiquetas.some(etiqueta => etiqueta.skuId === id);
        if (isSkuInUse) {
            console.error(`Attempted to delete SKU ${id} which is in use.`);
            return false;
        }
        setSkus(prevSkus => prevSkus.filter(s => s.id !== id));
        logEvent(AuditActionType.DELETE, 'SKU', id, 'SKU excluído.');
        return true;
    };

    const calculateAndApplyABCClassification = (): { success: boolean; message: string } => {
        const pickingMissions = missoes.filter(m => m.tipo === MissaoTipo.PICKING);
        if (pickingMissions.length === 0) {
            return { success: false, message: "Não há histórico de picking suficiente para calcular a curva ABC." };
        }

        const skuCounts = pickingMissions.reduce((acc, mission) => {
            acc[mission.skuId] = (acc[mission.skuId] || 0) + 1; // Count by number of picks
            return acc;
        }, {} as Record<string, number>);

        const sortedSkus = Object.entries(skuCounts).sort(([, a], [, b]) => b - a);
        
        const totalPicks = sortedSkus.reduce((sum, [, count]) => sum + count, 0);
        const classAThreshold = totalPicks * 0.80;
        const classBThreshold = totalPicks * 0.95;

        let cumulativePicks = 0;
        const classifiedSkuIds: Record<string, 'A' | 'B' | 'C'> = {};
        
        sortedSkus.forEach(([skuId, count]) => {
            cumulativePicks += count;
            if (cumulativePicks <= classAThreshold) {
                classifiedSkuIds[skuId] = 'A';
            } else if (cumulativePicks <= classBThreshold) {
                classifiedSkuIds[skuId] = 'B';
            } else {
                classifiedSkuIds[skuId] = 'C';
            }
        });
        
        let updatedCount = 0;
        setSkus(prevSkus => {
            return prevSkus.map(sku => {
                const newClass = classifiedSkuIds[sku.id];
                if (newClass && sku.classificacaoABC !== newClass) {
                    updatedCount++;
                    return { ...sku, classificacaoABC: newClass };
                }
                // If SKU has no picks, classify as C
                if (!classifiedSkuIds[sku.id] && sku.classificacaoABC !== 'C') {
                    updatedCount++;
                    return { ...sku, classificacaoABC: 'C' };
                }
                return sku;
            });
        });

        logEvent(AuditActionType.UPDATE, 'SKU', 'BATCH_ABC', `Recálculo de Curva ABC executado. ${updatedCount} SKUs atualizados.`);
        return { success: true, message: `Curva ABC calculada. ${updatedCount} SKUs foram atualizados.` };
    };


    // Endereco Management
    const addEndereco = (endereco: Omit<Endereco, 'id'>) => {
        const newEnd = { ...endereco, id: generateId(), status: endereco.status || EnderecoStatus.LIVRE };
        setEnderecos(prev => [...prev, newEnd]);
        logEvent(AuditActionType.CREATE, 'Endereço', newEnd.id, `Endereço ${newEnd.codigo} criado.`);
    };
    const addEnderecosBatch = (newEnderecos: Omit<Endereco, 'id'>[]) => {
        const enderecosWithIds = newEnderecos.map(end => ({ ...end, id: generateId(), status: end.status || EnderecoStatus.LIVRE }));
        setEnderecos(prev => [...prev, ...enderecosWithIds]);
        logEvent(AuditActionType.CREATE, 'Endereço', 'BATCH', `Importação em lote de ${newEnderecos.length} endereços.`);
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
            return false;
        }
        
        const isIndustriaInSku = skus.some(s => s.industriaId === id);
        if (isIndustriaInSku) {
            return false;
        }

        const isIndustriaInEndereco = enderecos.some(e => e.industriaId === id);
        if (isIndustriaInEndereco) {
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
        logEvent(AuditActionType.CREATE, 'Recebimento', newRecebimento.id, `Recebimento criado NF ${newRecebimento.notaFiscal}. ${etiquetasCount} LPNs gerados.`);

        return { newRecebimento, newEtiquetas };
    };
    
    const updateRecebimento = async (updatedRecebimento: Recebimento) => {
        setRecebimentos(prev => prev.map(r => r.id === updatedRecebimento.id ? updatedRecebimento : r));
    }


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
        
        logEvent(AuditActionType.CREATE, 'Etiqueta', 'INV', 'Etiqueta criada via inventário/ajuste.');
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
    
    const apontarEtiqueta = (id: string, data: Partial<Etiqueta>): { success: boolean; message?: string, warnings?: string[] } => {
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
        logEvent(AuditActionType.UPDATE, 'Etiqueta', id, `Apontamento realizado: SKU ${sku.sku}, Qtd ${data.quantidadeCaixas}.`);
        return { success: true, warnings };
    };

    // --- IA ENGINE: PUTAWAY ---
    const getBestPutawayAddress = (etiqueta: Etiqueta): IASuggestion | null => {
        const sku = skus.find(s => s.id === etiqueta.skuId);
        if (!sku) return null;

        const availableAddresses = enderecos.filter(e => 
            e.status === EnderecoStatus.LIVRE && 
            e.tipo === EnderecoTipo.ARMAZENAGEM
        );

        if (availableAddresses.length === 0) return null;

        const skuSres = [sku.sre1, sku.sre2, sku.sre3, sku.sre4, sku.sre5].filter(Boolean).map(s => s.toUpperCase());

        let bestMatch: IASuggestion | null = null;

        for (const addr of availableAddresses) {
            let score = 0;
            let reasons: string[] = [];

            // 1. Hard Constraint: SRE (Rules)
            const addrSres = [addr.sre1, addr.sre2, addr.sre3, addr.sre4, addr.sre5].filter(Boolean).map(s => s.toUpperCase());
            
            if (addrSres.length > 0) {
                const hasMatch = skuSres.some(s => addrSres.includes(s));
                if (!hasMatch) continue; // Skip if address has rules but product doesn't match
                score += 500;
                reasons.push("Regra de Armazenagem Compatível");
            } else if (skuSres.length > 0) {
                // SKU has rules, address is generic. Lower priority but allowed if no hard rule blocks generic.
                score -= 100; 
            }

            // 2. Soft Constraint: Affinity (Proximity to same SKU)
            // Find closest picking slot for this SKU
            const pickingSlot = enderecos.find(e => e.tipo === EnderecoTipo.PICKING && etiquetas.some(et => et.enderecoId === e.id && et.skuId === sku.id));
            
            if (pickingSlot) {
                // Simple distance logic: Same aisle (first part of code)
                const pickingAisle = pickingSlot.codigo.split('-')[0];
                const addrAisle = addr.codigo.split('-')[0];
                if (pickingAisle === addrAisle) {
                    score += 200;
                    reasons.push("Próximo ao Picking do Produto");
                }
            }

            // 3. Soft Constraint: ABC Classification
            // A items closer to start (Alphabetically lower aisles), C items deeper
            const aisleChar = addr.codigo.charAt(0).toUpperCase();
            const aisleVal = aisleChar.charCodeAt(0); // A=65, B=66...
            
            if (sku.classificacaoABC === 'A') {
                score += (90 - aisleVal) * 2; // Prefer A, B, C aisles
            } else if (sku.classificacaoABC === 'C') {
                score += (aisleVal - 65) * 2; // Prefer Z, Y, X aisles
            }

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = {
                    endereco: addr,
                    score,
                    reason: reasons.length > 0 ? reasons.join(', ') : 'Posição Livre Disponível'
                };
            }
        }

        return bestMatch;
    };

    const armazenarEtiqueta = (id: string, enderecoId: string): { success: boolean; message?: string } => {
        let success = false;
        let message = '';
        let enderecoDestinoNome = '';
        
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
                enderecoDestinoNome = enderecoDestino.nome;
                
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

        if (success) {
            logEvent(AuditActionType.MOVE, 'Etiqueta', id, `Pallet armazenado em ${enderecoDestinoNome}.`);
        }

        return { success, message };
    };
    
    // Pedido Management
    const addPedidos = (newPedidos: Pedido[]) => {
        setPedidos(prev => [...prev, ...newPedidos]);
        logEvent(AuditActionType.CREATE, 'Pedido', 'BATCH', `Importados ${newPedidos.length} pedidos.`);
    };
    const updatePedido = (pedidoId: string, data: Partial<Omit<Pedido, 'id'>>) => {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, ...data } : p));
        logEvent(AuditActionType.UPDATE, 'Pedido', pedidoId, `Status/Dados alterados.`);
    };

    const reabrirSeparacao = (pedidoId: string, motivo: string) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return { success: false, message: "Pedido não encontrado." };

        if (!motivo || motivo.trim() === '') {
            return { success: false, message: "O motivo para reabertura é obrigatório." };
        }

        const statusesPermitidos: Pedido['status'][] = ['Separado', 'Em Conferência', 'Conferência Parcial', 'Conferido', 'Aguardando Ressuprimento'];
        if (!statusesPermitidos.includes(pedido.status)) {
            return { success: false, message: `Não é possível reabrir um pedido com status "${pedido.status}".` };
        }

        logEvent(AuditActionType.STATUS_CHANGE, 'Pedido', pedidoId, `Reabertura de separação. Motivo: ${motivo}`);

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

        return { success: true, message: `Separação do pedido ${pedido.numeroTransporte} reaberta. Motivo: ${motivo}.` };
    };


     const processTransportData = (transportData: any[]): Promise<{ success: boolean; message: string; }> => {
        return new Promise((resolve) => {
            setTimeout(() => { // Simulate network delay
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
                        resolve({ success: false, message: `Transporte ${numeroTransporte} já existe.`});
                        return;
                    }
                    const items: PedidoItem[] = [];
                    for (const row of groupedByTransporte[numeroTransporte]) {
                        const sku = skus.find(s => String(s.sku) === String(row['Cód.Item']));
                        if (!sku) {
                            resolve({ success: false, message: `SKU ${row['Cód.Item']} não encontrado no cadastro.` });
                            return;
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
                addPedidos(newPedidos);
                resolve({ success: true, message: `${newPedidos.length} transportes importados com sucesso.` });
            }, 500); // 500ms delay
        });
    };

    // --- IA ENGINE: PICKING ALLOCATION ---
    const generateMissionsForPedido = (pedidoId: string): { success: boolean; message: string; } => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return { success: false, message: "Pedido não encontrado." };
        if (pedido.status !== 'Pendente') return { success: false, message: `O pedido ${pedido.numeroTransporte} já está ${pedido.status}.` };

        const antechamber = enderecos.find(e => e.tipo === EnderecoTipo.ANTECAMARA);
        if (!antechamber) return { success: false, message: "Nenhum endereço do tipo 'Antecâmara' encontrado." };
        
        let newMissions: Missao[] = [];
        let missionEtiquetas = new Set<string>();
        let errors: string[] = [];
        let needsReplenishment = false;

        for (const item of pedido.items) {
            const sku = skus.find(s => s.sku === item.sku);
            if (!sku) {
                errors.push(`SKU ${item.sku} não encontrado.`);
                continue;
            }
            if (sku.status === SKUStatus.BLOQUEADO) {
                errors.push(`SKU ${item.sku} está bloqueado.`);
                continue;
            }

            let quantidadePendente = item.quantidadeCaixas;

            // FEFO Strategy: Sort by Expiration Date
            const allAvailableEtiquetas = etiquetas.filter(e =>
                e.skuId === sku.id &&
                e.lote === item.lote &&
                e.status === EtiquetaStatus.ARMAZENADA &&
                !e.isBlocked
            ).sort((a, b) => { 
                const dateA = a.validade ? new Date(a.validade).getTime() : 0;
                const dateB = b.validade ? new Date(b.validade).getTime() : 0;
                return dateA - dateB; 
            });

            if (allAvailableEtiquetas.filter(e => !missionEtiquetas.has(e.id)).length === 0) {
                errors.push(`Sem estoque para SKU ${item.sku}, Lote ${item.lote}.`);
                continue;
            }
            
            // Logic for Full Pallet vs Picking
            // If quantity needed >= Full Pallet, take from Storage directly (more efficient)
            // Otherwise, take from Picking face.
            
            const fullPalletInStorage = allAvailableEtiquetas.find(e =>
                e.quantidadeCaixas === quantidadePendente &&
                enderecos.find(end => end.id === e.enderecoId)?.tipo === EnderecoTipo.ARMAZENAGEM &&
                !missionEtiquetas.has(e.id)
            );
    
            if (fullPalletInStorage && fullPalletInStorage.enderecoId) {
                newMissions.push({
                    id: generateId(),
                    tipo: MissaoTipo.MOVIMENTACAO_PALLET,
                    pedidoId: pedido.id,
                    etiquetaId: fullPalletInStorage.id,
                    skuId: sku.id,
                    quantidade: quantidadePendente,
                    origemId: fullPalletInStorage.enderecoId,
                    destinoId: antechamber.id,
                    status: 'Pendente',
                    createdAt: new Date().toISOString(),
                    prioridadeScore: 10
                });
                missionEtiquetas.add(fullPalletInStorage.id);
                quantidadePendente = 0;
            }
            
            if (quantidadePendente > 0) {
                // Prefer picking location
                const etiquetasDePicking = allAvailableEtiquetas.filter(e => 
                    enderecos.find(end => end.id === e.enderecoId)?.tipo === EnderecoTipo.PICKING &&
                    !missionEtiquetas.has(e.id)
                );

                for (const etiqueta of etiquetasDePicking) {
                    if (quantidadePendente <= 0) break;
                    const quantidadeNoPallet = etiqueta.quantidadeCaixas || 0;
                    const quantidadeRetirar = Math.min(quantidadePendente, quantidadeNoPallet);
                    
                    if (quantidadeRetirar > 0 && etiqueta.enderecoId) {
                            newMissions.push({
                            id: generateId(),
                            tipo: MissaoTipo.PICKING,
                            pedidoId: pedido.id,
                            etiquetaId: etiqueta.id,
                            skuId: sku.id,
                            quantidade: quantidadeRetirar,
                            origemId: etiqueta.enderecoId,
                            destinoId: antechamber.id,
                            status: 'Pendente',
                            createdAt: new Date().toISOString(),
                            prioridadeScore: pedido.priority ? 20 : 5
                        });
                        missionEtiquetas.add(etiqueta.id);
                        quantidadePendente -= quantidadeRetirar;
                    }
                }
                
                // If Picking is not enough, trigger Replenishment
                if (quantidadePendente > 0) {
                    const etiquetasDeArmazenagem = allAvailableEtiquetas.filter(e => 
                        enderecos.find(end => end.id === e.enderecoId)?.tipo === EnderecoTipo.ARMAZENAGEM &&
                        !missionEtiquetas.has(e.id)
                    );

                    if (etiquetasDeArmazenagem.length > 0) {
                        needsReplenishment = true;
                        const etiquetaParaMover = etiquetasDeArmazenagem[0]; // FEFO best match
                        const destinoVazio = enderecos.find(e => e.tipo === EnderecoTipo.PICKING && e.status === EnderecoStatus.LIVRE);

                        if (destinoVazio && etiquetaParaMover.enderecoId) {
                            const newMission: Missao = {
                                id: generateId(),
                                tipo: MissaoTipo.REABASTECIMENTO,
                                pedidoId: pedido.id,
                                etiquetaId: etiquetaParaMover.id,
                                skuId: sku.id,
                                quantidade: etiquetaParaMover.quantidadeCaixas || 0, // Move entire pallet
                                origemId: etiquetaParaMover.enderecoId,
                                destinoId: destinoVazio.id,
                                status: 'Pendente',
                                createdAt: new Date().toISOString(),
                                prioridadeScore: 50 // High Priority
                            };
                            newMissions.push(newMission);
                            missionEtiquetas.add(etiquetaParaMover.id);
                            // Note: We are NOT creating the picking mission yet for this remainder. 
                            // The system assumes after replenishment, the picking mission will be generated or the user waits.
                            errors.push(`[AVISO] Ressuprimento necessário para SKU ${sku.sku}. Missão criada.`);
                        } else {
                            errors.push(`[ERRO] Ressuprimento necessário para SKU ${sku.sku}, mas sem posição de picking livre.`);
                        }
                    } else {
                         errors.push(`Estoque insuficiente total para SKU ${sku.sku}.`);
                    }
                }
            }
        }
        
        if (newMissions.length > 0) {
            let newPedidoStatus: Pedido['status'] = needsReplenishment ? 'Aguardando Ressuprimento' : 'Em Separação';

            setMissoes(prev => [...prev, ...newMissions]);
            setEtiquetas(prev => prev.map(e => missionEtiquetas.has(e.id) ? { ...e, status: EtiquetaStatus.EM_SEPARACAO } : e));
            setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, status: newPedidoStatus } : p));
            
            logEvent(AuditActionType.CREATE, 'Missão', 'BATCH', `Geradas ${newMissions.length} missões para pedido ${pedido.numeroTransporte}.`);

            let successMessage = `${newMissions.length} missões geradas.`;
            if (errors.length > 0) {
                successMessage += `\n\nDetalhes:\n- ${errors.join('\n- ')}`;
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
        // Deprecated by generateMissionsForPedido, keeping for legacy if needed
        generateMissionsForPedido(pedido.id);
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
        
        logEvent(AuditActionType.CREATE, 'Missão', newMission.id, `Missão ${newMission.tipo} criada manualmente.`);
        return newMission;
    };
    
    const deleteMission = (missionId: string) => {
        const missionToDelete = missoes.find(m => m.id === missionId);
        if (!missionToDelete) return;

        setMissoes(prev => prev.filter(m => m.id !== missionId));
        
        setEtiquetas(prev => 
            prev.map(etiqueta => 
                etiqueta.id === missionToDelete.etiquetaId
                    ? { ...etiqueta, status: EtiquetaStatus.ARMAZENADA }
                    : etiqueta
            )
        );
        logEvent(AuditActionType.DELETE, 'Missão', missionId, `Missão excluída.`);
    };

    const revertMission = (missionId: string) => {
        setMissoes(prev => 
            prev.map(m => 
                m.id === missionId 
                    ? { ...m, status: 'Pendente', operadorId: undefined, startedAt: undefined }
                    : m
            )
        );
        logEvent(AuditActionType.STATUS_CHANGE, 'Missão', missionId, `Missão estornada para pendente.`);
    };

    const revertMissionGroup = (missionIds: string[]) => {
        setMissoes(prev => 
            prev.map(m => 
                missionIds.includes(m.id)
                    ? { ...m, status: 'Pendente', operadorId: undefined, startedAt: undefined }
                    : m
            )
        );
        logEvent(AuditActionType.STATUS_CHANGE, 'Missão', 'BATCH', `${missionIds.length} missões estornadas.`);
    };

    const updateMissionStatus = (missionId: string, status: Missao['status'], operadorId?: string, completedQuantity?: number, divergenceReason?: string, observation?: string) => {
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
                // Update Stock Logic here (Simplification for context)
                // In a real backend, this would be a transaction reducing stock from 'LPN'
            }

            const updatedMissoes = prevMissoes.map(m => (m.id === missionId ? updatedMission : m));
            
            // Check if Pedido is complete
            if (status === 'Concluída' && updatedMission?.pedidoId) {
                const pedidoId = updatedMission.pedidoId;
                const allMissionsForPedido = updatedMissoes.filter(m => m.pedidoId === pedidoId && (m.tipo === MissaoTipo.PICKING || m.tipo === MissaoTipo.REABASTECIMENTO));
                const allPickingCompleted = allMissionsForPedido.every(m => m.status === 'Concluída');
                
                if (allPickingCompleted) {
                    setPedidos(prevPedidos => prevPedidos.map(p => p.id === pedidoId ? { ...p, status: 'Separado' } : p));
                    logEvent(AuditActionType.STATUS_CHANGE, 'Pedido', pedidoId, 'Separação concluída.');
                }
            }
            return updatedMissoes;
        });
        logEvent(AuditActionType.STATUS_CHANGE, 'Missão', missionId, `Status alterado para ${status}.`);
    };
    
    const assignNextMission = (operadorId: string): Missao | null => {
        let assignedMission: Missao | null = null;
        setMissoes(prevMissoes => {
            const hasActiveMission = prevMissoes.some(m => m.operadorId === operadorId && (m.status === 'Atribuída' || m.status === 'Em Andamento'));
            if (hasActiveMission) {
                return prevMissoes;
            }

            // Intelligent Assignment: Score based priority
            const pendingMissions = prevMissoes
                .filter(m => m.status === 'Pendente')
                .sort((a, b) => (b.prioridadeScore || 0) - (a.prioridadeScore || 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            if (pendingMissions.length === 0) {
                return prevMissoes;
            }

            const missionToAssign = pendingMissions[0];
            const newStatus: Missao['status'] = 'Atribuída';
            assignedMission = { ...missionToAssign, status: newStatus, operadorId: operadorId };
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
            
            const now = new Date().toISOString();
            const newStatus: Missao['status'] = 'Atribuída';
            assignedMissions = missionsToAssign.map((m) => ({ ...m, status: newStatus, operadorId, startedAt: now }));

            return prevMissoes.map(m => {
                const updated = assignedMissions.find(um => um.id === m.id);
                return updated || m;
            });
        });
        
        if (assignedMissions.length > 0) {
            logEvent(AuditActionType.UPDATE, 'Missão', 'BATCH', `Onda de Picking atribuída ao operador ${operadorId}.`);
            return { success: true, missions: assignedMissions };
        } else {
            return { success: false, message: 'Nenhuma missão pendente encontrada ou já atribuída.' };
        }
    };

    const getMyActivePickingGroup = (operadorId: string): Missao[] | null => {
        const activeMissions = missoes.filter(m =>
            m.operadorId === operadorId &&
            (m.status === 'Atribuída' || m.status === 'Em Andamento') &&
            (m.tipo === MissaoTipo.PICKING)
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

    const addDivergencia = async (divergenciaData: Omit<Divergencia, 'id' | 'createdAt'>) => {
        const newDivergencia: Divergencia = { ...divergenciaData, id: generateId(), createdAt: new Date().toISOString() };
        setDivergencias(prev => [...prev, newDivergencia]);
        logEvent(AuditActionType.CREATE, 'Divergência', newDivergencia.id, `${newDivergencia.tipo} registrada.`);
    };

    const deleteDivergencia = async (id: string) => {
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
        if (!userToDelete) return { success: false, message: 'Usuário não encontrado.' };
        setUsers(prev => prev.filter(u => u.id !== id));
        return { success: true };
    };

    // Profile Management
    const addProfile = (profileData: Omit<Profile, 'id'>) => {
        const newProfile = { ...profileData, id: generateId() };
        setProfiles(prev => [...prev, newProfile]);
        return { success: true };
    };

    const updateProfile = (updatedProfile: Profile) => {
        setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        return { success: true };
    };

    const deleteProfile = (id: string) => {
        setProfiles(prev => prev.filter(p => p.id !== id));
        return { success: true };
    };
    
    // Tipos de Bloqueio Management
    const addTipoBloqueio = (tipoData: Omit<TipoBloqueio, 'id'>) => {
        const newTipo = { ...tipoData, id: generateId() };
        setTiposBloqueio(prev => [...prev, newTipo]);
        return { success: true };
    };

    const updateTipoBloqueio = (updatedTipo: TipoBloqueio) => {
        setTiposBloqueio(prev => prev.map(tb => tb.id === updatedTipo.id ? updatedTipo : tb));
        return { success: true };
    };

    const deleteTipoBloqueio = (id: string) => {
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
        logEvent(AuditActionType.CREATE, 'Conferência', newSession.id, 'Sessão de Inventário iniciada.');
        return newSession;
    };

    const recordCountItem = (itemData: Omit<InventoryCountItem, 'id'>) => {
        const newItem: InventoryCountItem = { ...itemData, id: generateId() };
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
        logEvent(AuditActionType.STATUS_CHANGE, 'Conferência', sessionId, 'Sessão de Inventário finalizada.');
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
        logEvent(AuditActionType.CREATE, 'Conferência', newConferencia.id, `Conferência iniciada para pedido ${pedido.numeroTransporte}`);
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
        let replenishmentMissionsCreated: string[] = [];
        const newErrors: ConferenciaErro[] = [];
        
        const antechamber = enderecos.find(e => e.tipo === EnderecoTipo.ANTECAMARA);

        for(const pedidoItem of pedido.items) {
            const sku = skus.find(s => s.sku === pedidoItem.sku);
            if (!sku) continue;

            const key = `${sku.id}|${pedidoItem.lote}`;
            const confirmed = confirmedQuantities[key];
            const countedQty = confirmed?.counted === '' || confirmed?.counted === undefined ? 0 : Number(confirmed.counted);
            const expectedQty = pedidoItem.quantidadeCaixas;
            const difference = countedQty - expectedQty;

            if (difference < 0) { // Falta
                hasMismatch = true;
                const missingQty = Math.abs(difference);
                const reason = confirmed?.reason || ConferenciaErroTipo.FALTA;
                newErrors.push({ 
                    id: generateId(), 
                    conferenciaId, 
                    pedidoId: pedido.id, 
                    skuId: sku.id, 
                    lote: pedidoItem.lote, 
                    tipo: reason, 
                    quantidadeDivergente: missingQty, 
                    conferenteId: conferencia.conferenteId, 
                    createdAt: new Date().toISOString() 
                });
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

        if (replenishmentMissionsCreated.length > 0) {
            finalStatus = 'Aguardando Ressuprimento';
            message = `Saldo localizado. Missões de ressuprimento criadas.`;
        } else if (hasMismatch) {
            finalStatus = 'Conferência Parcial';
             message += ` Foram encontradas ${newErrors.length} divergências.`;
        }

        setConferencias(prev => prev.map(c => c.id === conferenciaId ? { ...c, status: 'Concluída', finishedAt: new Date().toISOString() } : c));
        setPedidos(prev => prev.map(p => p.id === conferencia.pedidoId ? { ...p, status: finalStatus } : p));
        logEvent(AuditActionType.STATUS_CHANGE, 'Conferência', conferenciaId, 'Conferência finalizada.');
        return { message };
    };


    const value = {
        skus, addSku, addSkusBatch, updateSku, deleteSku, calculateAndApplyABCClassification,
        enderecos, addEndereco, addEnderecosBatch, updateEndereco, deleteEndereco,
        industrias, addIndustria, addIndustriasBatch, updateIndustria, deleteIndustria,
        recebimentos, addRecebimento, updateRecebimento,
        etiquetas, getEtiquetaById, updateEtiqueta, addEtiqueta, deleteEtiqueta, deleteEtiquetas, getEtiquetasByRecebimento, getEtiquetasPendentesApontamento, apontarEtiqueta, armazenarEtiqueta, getBestPutawayAddress,
        pedidos, addPedidos, updatePedido, reabrirSeparacao, processTransportData, generateMissionsForPedido,
        missoes, createPickingMissions, createMission, deleteMission, revertMission, revertMissionGroup, assignNextMission, updateMissionStatus, assignFamilyMissionsToOperator, getMyActivePickingGroup,
        palletsConsolidados, addPalletConsolidado,
        divergencias, getDivergenciasByRecebimento, addDivergencia, deleteDivergencia,
        users, addUser, updateUser, deleteUser,
        profiles, addProfile, updateProfile, deleteProfile,
        tiposBloqueio, addTipoBloqueio, updateTipoBloqueio, deleteTipoBloqueio,
        inventoryCountSessions, inventoryCountItems, startInventoryCount, recordCountItem, undoLastCount, finishInventoryCount, getCountItemsBySession,
        conferencias, conferenciaItems, conferenciaErros, startConferencia, getActiveConferencia, finishConferencia,
        auditLogs, logEvent,
        pickingConfig, setPickingConfig,
        appConfig, setAppConfig
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
