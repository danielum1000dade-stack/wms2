
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
    SKU, Endereco, Recebimento, Etiqueta, Pedido, Missao, PalletConsolidado, 
    EtiquetaStatus, MissaoTipo, EnderecoTipo, Industria, Divergencia, 
    EnderecoStatus, User, UserStatus, Profile, 
    InventoryCountSession, InventoryCountItem, SKUStatus,
    TipoBloqueio,
    Conferencia, ConferenciaItem, ConferenciaErro,
    AuditLog, AuditActionType,
    ImportTemplate, ImportLog,
    PrinterConfig,
    Permission
} from '../types';

// Interfaces
declare const XLSX: any;

const OPERADOR_PROFILE_ID = 'operador_profile';
const ADMIN_PROFILE_ID = 'admin_profile';

interface IASuggestion {
    endereco: Endereco;
    score: number;
    reason: string;
}

interface ValidationResult {
    success: boolean;
    message?: string;
}

interface ImportResult {
    success: boolean;
    logId: string;
    total: number;
    errors: string[];
}

interface WMSContextType {
    isLoading: boolean;
    isOffline: boolean;
    
    skus: SKU[];
    enderecos: Endereco[];
    industrias: Industria[];
    recebimentos: Recebimento[];
    etiquetas: Etiqueta[];
    pedidos: Pedido[];
    missoes: Missao[];
    users: User[];
    profiles: Profile[];
    auditLogs: AuditLog[];

    addSku: (sku: Omit<SKU, 'id'>) => Promise<void>;
    addSkusBatch: (skus: Omit<SKU, 'id'>[]) => Promise<void>;
    updateSku: (sku: SKU) => Promise<void>;
    deleteSku: (id: string) => Promise<boolean>;
    calculateAndApplyABCClassification: () => { success: boolean, message: string };
    
    addEndereco: (endereco: Omit<Endereco, 'id'>) => Promise<void>;
    addEnderecosBatch: (enderecos: Omit<Endereco, 'id'>[]) => Promise<void>;
    updateEndereco: (endereco: Endereco) => Promise<void>;
    deleteEndereco: (id: string) => Promise<void>;

    addIndustria: (industria: Omit<Industria, 'id'>) => Promise<void>;
    addIndustriasBatch: (industrias: Omit<Industria, 'id'>[]) => Promise<void>;
    updateIndustria: (industria: Industria) => Promise<void>;
    deleteIndustria: (id: string) => Promise<boolean>;

    addRecebimento: (recebimentoData: Omit<Recebimento, 'id'>, etiquetasCount: number) => Promise<{ newRecebimento: Recebimento, newEtiquetas: Etiqueta[] }>;
    updateRecebimento: (recebimento: Recebimento) => Promise<void>;

    addEtiqueta: (etiquetaData: Partial<Etiqueta>) => Promise<Etiqueta>;
    updateEtiqueta: (etiqueta: Etiqueta) => Promise<void>;
    deleteEtiqueta: (id: string) => Promise<{ success: boolean, message?: string }>;
    deleteEtiquetas: (ids: string[]) => Promise<{ success: boolean }>;
    apontarEtiqueta: (id: string, data: Partial<Etiqueta>) => Promise<{ success: boolean, message?: string, warnings?: string[] }>;
    armazenarEtiqueta: (id: string, enderecoId: string) => Promise<{ success: boolean, message?: string }>;

    getEtiquetaById: (id: string) => Etiqueta | undefined;
    getEtiquetasByRecebimento: (recebimentoId: string) => Etiqueta[];
    getEtiquetasPendentesApontamento: () => Etiqueta[];
    getBestPutawayAddress: (etiqueta: Etiqueta) => IASuggestion | null;
    
    addPedidos: (pedidos: Pedido[]) => Promise<void>;
    updatePedido: (pedidoId: string, data: Partial<Omit<Pedido, 'id'>>) => Promise<void>;
    reabrirSeparacao: (pedidoId: string, motivo: string) => { success: boolean, message: string };
    processTransportData: (transportData: any[]) => Promise<{ success: boolean; message: string; }>;
    generateMissionsForPedido: (pedidoId: string) => { success: boolean; message: string; };
    
    createMission: (missionData: Omit<Missao, 'id' | 'status' | 'createdAt'>) => Promise<Missao>;
    createPickingMissions: (pedido: Pedido) => void;
    deleteMission: (missionId: string) => Promise<void>;
    revertMission: (missionId: string) => Promise<void>;
    revertMissionGroup: (missionIds: string[]) => Promise<void>;
    updateMissionStatus: (missionId: string, status: Missao['status'], operadorId?: string, completedQuantity?: number, divergenceReason?: string, observation?: string) => Promise<void>;
    assignNextMission: (operadorId: string) => Missao | null;
    assignFamilyMissionsToOperator: (pedidoId: string, familia: string, operadorId: string) => { success: boolean; missions?: Missao[]; message?: string };
    getMyActivePickingGroup: (operadorId: string) => Missao[] | null;

    addUser: (user: Omit<User, 'id'>) => Promise<{ success: boolean, message?: string }>;
    registerUser: (user: { username: string, fullName: string, password?: string }) => Promise<{ success: boolean, message?: string }>;
    updateUser: (user: User) => Promise<{ success: boolean, message?: string }>;
    deleteUser: (id: string) => Promise<{ success: boolean, message?: string }>;

    addProfile: (profile: Omit<Profile, 'id'>) => Promise<{ success: boolean, message?: string }>;
    updateProfile: (profile: Profile) => Promise<{ success: boolean, message?: string }>;
    deleteProfile: (id: string) => Promise<{ success: boolean, message?: string }>;

    divergencias: Divergencia[];
    getDivergenciasByRecebimento: (recebimentoId: string) => Divergencia[];
    addDivergencia: (divergencia: Omit<Divergencia, 'id' | 'createdAt'>) => Promise<void>;
    deleteDivergencia: (id: string) => Promise<void>;

    palletsConsolidados: PalletConsolidado[];
    addPalletConsolidado: (pallet: Omit<PalletConsolidado, 'id'>) => PalletConsolidado;

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

    conferencias: Conferencia[];
    conferenciaItems: ConferenciaItem[];
    conferenciaErros: ConferenciaErro[];
    startConferencia: (pedidoId: string, conferenteId: string) => Conferencia | null;
    getActiveConferencia: (conferenteId: string) => { conferencia: Conferencia, pedido: Pedido } | null;
    finishConferencia: (conferenciaId: string, confirmedQuantities: any) => { message: string };

    logEvent: (actionType: AuditActionType, entity: AuditLog['entity'], entityId: string, details: string, metadata?: any) => void;
    
    pickingConfig: any;
    setPickingConfig: React.Dispatch<React.SetStateAction<any>>;
    appConfig: any;
    setAppConfig: React.Dispatch<React.SetStateAction<any>>;
    
    performFullPalletWriteOff: (etiquetaId: string, motivo: string, userId: string) => ValidationResult;
    checkReplenishmentNeeds: (skuId: string) => void;
    validateMovement: (etiqueta: Etiqueta, targetAddress: Endereco) => ValidationResult;
    reportPickingShortage: (missionId: string, userId: string) => void;

    importTemplates: ImportTemplate[];
    saveImportTemplate: (template: ImportTemplate) => void;
    deleteImportTemplate: (id: string) => void;
    importLogs: ImportLog[];
    processImportFile: (fileData: any[], template: ImportTemplate, fileName: string, simulate?: boolean) => Promise<ImportResult>;

    printerConfig: PrinterConfig;
    savePrinterConfig: (config: PrinterConfig) => void;
    generatePalletLabelZPL: (etiqueta: Etiqueta) => string;
}

const WMSContext = createContext<WMSContextType | undefined>(undefined);

const defaultProfiles: Profile[] = [
    {
        id: ADMIN_PROFILE_ID,
        name: 'Admin',
        permissions: Object.values(Permission).reduce<Record<string, boolean>>((acc, p) => ({ ...acc, [p]: true }), {})
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
            [Permission.BAIXA_PALLET]: false
        }
    }
];

export const WMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Estados de Controle
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    // Estados de Dados (Persistidos Localmente como Fallback/Primary)
    const [skus, setSkus] = useLocalStorage<SKU[]>('wms_skus', []);
    const [enderecos, setEnderecos] = useLocalStorage<Endereco[]>('wms_enderecos', []);
    const [industrias, setIndustrias] = useLocalStorage<Industria[]>('wms_industrias', []);
    const [recebimentos, setRecebimentos] = useLocalStorage<Recebimento[]>('wms_recebimentos', []);
    const [etiquetas, setEtiquetas] = useLocalStorage<Etiqueta[]>('wms_etiquetas', []);
    const [pedidos, setPedidos] = useLocalStorage<Pedido[]>('wms_pedidos', []);
    const [missoes, setMissoes] = useLocalStorage<Missao[]>('wms_missoes', []);
    const [users, setUsers] = useLocalStorage<User[]>('wms_users', [{ id: 'admin_user', username: 'admin', fullName: 'Administrador', profileId: ADMIN_PROFILE_ID, status: UserStatus.ATIVO }]);
    const [profiles, setProfiles] = useLocalStorage<Profile[]>('wms_profiles', defaultProfiles);
    const [auditLogs, setAuditLogs] = useLocalStorage<AuditLog[]>('wms_audit_logs', []);
    
    // Estados puramente locais
    const [divergencias, setDivergencias] = useLocalStorage<Divergencia[]>('wms_divergencias', []);
    const [tiposBloqueio, setTiposBloqueio] = useLocalStorage<TipoBloqueio[]>('wms_tipos_bloqueio', []);
    const [importTemplates, setImportTemplates] = useLocalStorage<ImportTemplate[]>('wms_import_templates', []);
    const [importLogs, setImportLogs] = useLocalStorage<ImportLog[]>('wms_import_logs', []);
    const [inventoryCountSessions, setInventoryCountSessions] = useLocalStorage<InventoryCountSession[]>('wms_inventory_sessions', []);
    const [inventoryCountItems, setInventoryCountItems] = useLocalStorage<InventoryCountItem[]>('wms_inventory_items', []);
    const [palletsConsolidados, setPalletsConsolidados] = useLocalStorage<PalletConsolidado[]>('wms_pallets_consolidados', []);
    const [conferencias, setConferencias] = useLocalStorage<Conferencia[]>('wms_conferencias', []);
    const [conferenciaItems, setConferenciaItems] = useLocalStorage<ConferenciaItem[]>('wms_conferencia_items', []);
    const [conferenciaErros, setConferenciaErros] = useLocalStorage<ConferenciaErro[]>('wms_conferencia_erros', []);
    
    const [appConfig, setAppConfig] = useLocalStorage('wms_app_config', { replenishmentThreshold: 25 });
    const [pickingConfig, setPickingConfig] = useLocalStorage('wms_picking_config', { allowPickingFromAnyAddress: false });
    const [printerConfig, setPrinterConfig] = useLocalStorage<PrinterConfig>('wms_printer_config', { type: 'PDF_FALLBACK' });

    // Tenta conectar ao backend, se falhar, ativa modo offline
    const refreshData = async () => {
        try {
            const [rSkus, rEnderecos, rIndustrias, rRecebimentos, rEtiquetas, rPedidos, rMissoes, rUsers, rProfiles, rAudit] = await Promise.all([
                api.get('/skus'),
                api.get('/enderecos'),
                api.get('/industrias'),
                api.get('/recebimentos'),
                api.get('/etiquetas'),
                api.get('/pedidos'),
                api.get('/missoes'),
                api.get('/users'),
                api.get('/profiles'),
                api.get('/audit-logs')
            ]);

            // Se sucesso, atualiza estado local com dados do servidor (Server Authority)
            setSkus(rSkus.data);
            setEnderecos(rEnderecos.data);
            setIndustrias(rIndustrias.data);
            setRecebimentos(rRecebimentos.data);
            setEtiquetas(rEtiquetas.data);
            setPedidos(rPedidos.data);
            setMissoes(rMissoes.data);
            setUsers(rUsers.data);
            setProfiles(rProfiles.data);
            setAuditLogs(rAudit.data);
            
            setIsOffline(false);
        } catch (error) {
            // Silently fail to offline mode without error spam
            setIsOffline(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        // Tenta reconectar a cada 30s se estiver offline
        const interval = setInterval(() => {
            if (isOffline) refreshData();
        }, 30000); 
        return () => clearInterval(interval);
    }, [isOffline]);

    const generateId = () => new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);

    // --- ACTIONS WRAPPER ---
    // Executa no backend se online, senão executa localmente
    const executeAction = async <T,>(
        apiCall: () => Promise<any>,
        localAction: () => T | void
    ): Promise<T | any> => {
        if (isOffline) {
            return localAction();
        } else {
            try {
                const res = await apiCall();
                refreshData(); // Sincroniza
                return res.data || res;
            } catch (e) {
                console.error("Erro na API, executando localmente como fallback", e);
                setIsOffline(true);
                return localAction();
            }
        }
    };

    // --- CRUD IMPLEMENTATIONS ---

    const addSku = async (sku: Omit<SKU, 'id'>) => {
        await executeAction(
            () => api.post('/skus', { ...sku, status: SKUStatus.ATIVO }),
            () => setSkus(prev => [...prev, { ...sku, id: generateId(), status: SKUStatus.ATIVO } as SKU])
        );
    };
    const addSkusBatch = async (newSkus: Omit<SKU, 'id'>[]) => { 
        await executeAction(
            () => {
                const skusWithStatus = newSkus.map(s => ({...s, status: SKUStatus.ATIVO, id: generateId()}));
                return api.post('/skus/batch', skusWithStatus);
            },
            () => {
                const skusWithIds = newSkus.map(sku => ({ ...sku, id: generateId(), status: SKUStatus.ATIVO } as SKU));
                setSkus(prev => [...prev, ...skusWithIds]);
            }
        );
    };
    const updateSku = async (sku: SKU) => { 
        await executeAction(
            () => api.put(`/skus/${sku.id}`, sku),
            () => setSkus(prev => prev.map(s => s.id === sku.id ? sku : s))
        ); 
    };
    const deleteSku = async (id: string) => {
        if (etiquetas.some(e => e.skuId === id)) return false;
        await executeAction(
            () => api.delete(`/skus/${id}`),
            () => setSkus(prev => prev.filter(s => s.id !== id))
        );
        return true;
    };
    
    // --- ALGORITMO ABC REAL ---
    const calculateAndApplyABCClassification = () => {
        // 1. Coleta estatísticas de movimentação (Picking Concluído)
        const movementCounts: Record<string, number> = {};
        missoes.forEach(m => {
            if (m.tipo === MissaoTipo.PICKING && m.status === 'Concluída') {
                movementCounts[m.skuId] = (movementCounts[m.skuId] || 0) + m.quantidade;
            }
        });

        // 2. Ordena SKUs por volume decrescente
        const sortedSkuIds = Object.keys(movementCounts).sort((a, b) => movementCounts[b] - movementCounts[a]);
        const totalMovimentado = sortedSkuIds.length;

        if (totalMovimentado === 0) return { success: true, message: "Sem dados de movimentação suficientes para recalcular a curva ABC." };

        // 3. Aplica Regra de Pareto (A=20%, B=30%, C=50%)
        const limitA = Math.ceil(totalMovimentado * 0.2);
        const limitB = Math.ceil(totalMovimentado * 0.5); // 20% + 30%

        const updates: SKU[] = [];
        
        // SKUs com movimento
        sortedSkuIds.forEach((skuId, index) => {
            let newClass: 'A' | 'B' | 'C' = 'C';
            if (index < limitA) newClass = 'A';
            else if (index < limitB) newClass = 'B';

            const sku = skus.find(s => s.id === skuId);
            if (sku && sku.classificacaoABC !== newClass) {
                updates.push({ ...sku, classificacaoABC: newClass });
            }
        });

        // SKUs sem movimento viram C
        skus.forEach(s => {
            if (!movementCounts[s.id] && s.classificacaoABC !== 'C') {
                updates.push({ ...s, classificacaoABC: 'C' });
            }
        });

        // 4. Persiste as alterações
        if (updates.length > 0) {
            if (isOffline) {
                setSkus(prev => prev.map(s => {
                    const up = updates.find(u => u.id === s.id);
                    return up || s;
                }));
            } else {
                // Em produção, isso seria um endpoint batch. Aqui simulamos chamadas individuais.
                updates.forEach(u => api.put(`/skus/${u.id}`, u).catch(e => console.error(e)));
                // Refresh não imediato para não travar UI
                setTimeout(refreshData, 1000);
            }
            return { success: true, message: `Curva ABC recalculada. ${updates.length} SKUs atualizados.` };
        }

        return { success: true, message: "Curva ABC atualizada. Nenhuma mudança de classificação necessária." };
    };

    const addEndereco = async (endereco: Omit<Endereco, 'id'>) => { 
        await executeAction(
            () => api.post('/enderecos', { ...endereco, status: EnderecoStatus.LIVRE }),
            () => setEnderecos(prev => [...prev, {...endereco, id: generateId(), status: EnderecoStatus.LIVRE} as Endereco])
        ); 
    };
    const addEnderecosBatch = async (list: any[]) => { 
        await executeAction(
            () => api.post('/enderecos/batch', list.map(e => ({...e, id: generateId(), status: EnderecoStatus.LIVRE}))),
            () => setEnderecos(prev => [...prev, ...list.map(e => ({...e, id: generateId(), status: EnderecoStatus.LIVRE} as Endereco))])
        );
    }
    const updateEndereco = async (e: Endereco) => { 
        await executeAction(
            () => api.put(`/enderecos/${e.id}`, e),
            () => setEnderecos(prev => prev.map(end => end.id === e.id ? e : end))
        ); 
    };
    const deleteEndereco = async (id: string) => { 
        await executeAction(
            () => api.delete(`/enderecos/${id}`),
            () => setEnderecos(prev => prev.filter(e => e.id !== id))
        ); 
    };

    const addRecebimento = async (r: any, qtdEtiquetas: number) => {
        const localAction = () => {
            const nr = {...r, id: generateId(), dataHoraChegada: new Date().toISOString(), status: 'Aguardando', houveAvarias: false};
            const ne = Array.from({length: qtdEtiquetas}, (_, i) => ({ id: `P${nr.notaFiscal}-${i+1}-${Math.floor(Math.random()*1000)}`, recebimentoId: nr.id, status: EtiquetaStatus.PENDENTE_APONTAMENTO } as Etiqueta));
            setRecebimentos(prev => [...prev, nr as Recebimento]);
            setEtiquetas(prev => [...prev, ...ne]);
            return { newRecebimento: nr, newEtiquetas: ne };
        };

        if (isOffline) return localAction();

        try {
            const resRec = await api.post('/recebimentos', { ...r, dataHoraChegada: new Date().toISOString(), status: 'Aguardando' });
            const newRecebimento = resRec.data;
            const novasEtiquetas = [];
            for(let i=0; i < qtdEtiquetas; i++) {
                novasEtiquetas.push({
                    id: `P${newRecebimento.notaFiscal}-${i+1}-${Math.floor(Math.random()*1000)}`,
                    recebimentoId: newRecebimento.id,
                    status: EtiquetaStatus.PENDENTE_APONTAMENTO
                });
            }
            await api.post('/etiquetas/batch', novasEtiquetas);
            refreshData();
            return { newRecebimento, newEtiquetas: novasEtiquetas };
        } catch (e) {
            setIsOffline(true);
            return localAction();
        }
    };

    const updateRecebimento = async (r: Recebimento) => { 
        await executeAction(
            () => api.put(`/recebimentos/${r.id}`, r),
            () => setRecebimentos(prev => prev.map(rec => rec.id === r.id ? r : rec))
        ); 
    };

    const addEtiqueta = async (data: any) => { 
        return await executeAction(
            () => api.post('/etiquetas', { id: `INV-${generateId()}`, ...data }),
            () => { const n = { id: `INV-${generateId()}`, status: EtiquetaStatus.ARMAZENADA, ...data} as Etiqueta; setEtiquetas(prev => [...prev, n]); return n; }
        );
    };
    const updateEtiqueta = async (e: Etiqueta) => { 
        await executeAction(
            () => api.put(`/etiquetas/${e.id}`, e),
            () => setEtiquetas(prev => prev.map(et => et.id === e.id ? e : et))
        ); 
    }
    const deleteEtiqueta = async (id: string) => { 
        await executeAction(
            () => api.delete(`/etiquetas/${id}`),
            () => setEtiquetas(prev => prev.filter(e => e.id !== id))
        );
        return {success: true}; 
    };
    const deleteEtiquetas = async (ids: string[]) => { 
        if (isOffline) {
            setEtiquetas(prev => prev.filter(e => !ids.includes(e.id)));
        } else {
            for (const id of ids) await api.delete(`/etiquetas/${id}`);
            refreshData(); 
        }
        return {success: true}; 
    };

    const apontarEtiqueta = async (id: string, data: any) => {
        const sku = skus.find(s => s.id === data.skuId);
        if(!sku) return { success: false, message: "SKU Invalido" };
        await executeAction(
            () => api.put(`/etiquetas/${id}`, { ...data, status: EtiquetaStatus.APONTADA, dataApontamento: new Date().toISOString() }),
            () => setEtiquetas(prev => prev.map(e => e.id === id ? {...e, ...data, status: EtiquetaStatus.APONTADA, dataApontamento: new Date().toISOString()} : e))
        );
        return { success: true };
    };
    
    const armazenarEtiqueta = async (id: string, enderecoId: string) => {
        const end = enderecos.find(e => e.id === enderecoId);
        if(!end) return { success: false, message: "Endereço inválido" };
        const et = etiquetas.find(e => e.id === id);
        const val = validateMovement(et!, end);
        if (!val.success) return val;

        const localLogic = () => {
            setEnderecos(prev => prev.map(e => {
                if(e.id === et?.enderecoId) return {...e, status: EnderecoStatus.LIVRE};
                if(e.id === enderecoId) return {...e, status: EnderecoStatus.OCUPADO};
                return e;
            }));
            setEtiquetas(prev => prev.map(e => e.id === id ? {...e, enderecoId, status: EtiquetaStatus.ARMAZENADA, dataArmazenagem: new Date().toISOString()} : e));
        }

        if (isOffline) {
            localLogic();
        } else {
            try {
                if(et?.enderecoId) await api.put(`/enderecos/${et.enderecoId}`, { status: EnderecoStatus.LIVRE });
                await api.put(`/enderecos/${enderecoId}`, { status: EnderecoStatus.OCUPADO });
                await api.put(`/etiquetas/${id}`, { enderecoId, status: EtiquetaStatus.ARMAZENADA, dataArmazenagem: new Date().toISOString() });
                refreshData();
            } catch (e) {
                setIsOffline(true);
                localLogic();
            }
        }
        return { success: true };
    };

    // --- Helpers ---
    const getEtiquetaById = (id: string) => etiquetas.find(e => e.id === id);
    const getEtiquetasByRecebimento = (id: string) => etiquetas.filter(e => e.recebimentoId === id);
    const getEtiquetasPendentesApontamento = () => etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO);

    const validateMovement = (etiqueta: Etiqueta, targetAddress: Endereco): ValidationResult => {
        if (targetAddress.status === EnderecoStatus.BLOQUEADO) return { success: false, message: `Endereço bloqueado.` };
        if (targetAddress.status === EnderecoStatus.OCUPADO && etiqueta.enderecoId !== targetAddress.id) return { success: false, message: "Endereço já ocupado." };
        const sku = skus.find(s => s.id === etiqueta.skuId);
        if (!sku) return { success: false, message: "SKU não encontrado." };
        return { success: true };
    };

    const getBestPutawayAddress = (etiqueta: Etiqueta) => {
        const livre = enderecos.find(e => e.status === EnderecoStatus.LIVRE && e.tipo === EnderecoTipo.ARMAZENAGEM);
        if(livre) return { endereco: livre, score: 100, reason: "Posição Livre" };
        return null;
    };

    const addPedidos = async (lista: any[]) => { 
        await executeAction(
            () => api.post('/pedidos/batch', lista),
            () => setPedidos(prev => [...prev, ...lista])
        ); 
    };
    const updatePedido = async (id: string, data: any) => { 
        await executeAction(
            () => api.put(`/pedidos/${id}`, data),
            () => setPedidos(prev => prev.map(p => p.id === id ? {...p, ...data} : p))
        ); 
    };
    const reabrirSeparacao = (id: string, motivo: string) => { 
        updatePedido(id, { status: 'Pendente' });
        // local logic for clearing missions
        if(isOffline) setMissoes(prev => prev.filter(m => m.pedidoId !== id));
        return {success: true, message: "Pedido reaberto."}; 
    };
    
    const generateMissionsForPedido = (pid: string) => {
        const p = pedidos.find(ped => ped.id === pid);
        if(!p) return {success: false, message: "Pedido não encontrado"};
        
        const ms: Missao[] = [];
        
        p.items.forEach(async (item: any) => {
            const sku = skus.find(s => s.sku === item.sku);
            if(sku) {
                const stock = etiquetas.find(e => e.skuId === sku.id && e.status === EtiquetaStatus.ARMAZENADA);
                if(stock && stock.enderecoId) {
                    const newMission = {
                        id: generateId(),
                        tipo: MissaoTipo.PICKING, pedidoId: pid, etiquetaId: stock.id,
                        skuId: sku.id, quantidade: item.quantidadeCaixas, origemId: stock.enderecoId,
                        destinoId: 'STAGE', status: 'Pendente', createdAt: new Date().toISOString()
                    } as Missao;
                    ms.push(newMission);
                    
                    if (!isOffline) {
                        await api.post('/missoes', newMission);
                    }
                }
            }
        });
        
        if (isOffline) {
            setMissoes(prev => [...prev, ...ms]);
        }
        
        updatePedido(pid, { status: 'Em Separação' });
        return { success: true, message: "Gerado" };
    };

    const createMission = async (m: any) => { 
        return await executeAction(
            () => api.post('/missoes', { ...m, status: 'Pendente' }),
            () => { const nm = {...m, id: generateId(), status: 'Pendente', createdAt: new Date().toISOString()} as Missao; setMissoes(prev => [...prev, nm]); return nm; }
        );
    };
    const createPickingMissions = (p: Pedido) => generateMissionsForPedido(p.id);

    const updateMissionStatus = async (id: string, status: string, operadorId?: string, completedQuantity?: number) => {
        await executeAction(
            () => api.put(`/missoes/${id}`, { status, operadorId }),
            () => {
                setMissoes(prev => prev.map(m => {
                    if(m.id === id) {
                        // Logic side effects for local mode
                        if(status === 'Concluída' && m.tipo === MissaoTipo.PICKING) {
                            const e = etiquetas.find(et => et.id === m.etiquetaId);
                            if(e) updateEtiqueta({...e, quantidadeCaixas: Math.max(0, (e.quantidadeCaixas||0) - (completedQuantity || m.quantidade))});
                        } else if (status === 'Concluída' && m.tipo === MissaoTipo.REABASTECIMENTO) {
                            armazenarEtiqueta(m.etiquetaId, m.destinoId);
                        }
                        return {...m, status, operadorId: operadorId || m.operadorId} as Missao;
                    }
                    return m;
                }));
            }
        );
    };

    const assignNextMission = (uid: string) => {
        const m = missoes.find(ms => ms.status === 'Pendente');
        if(m) { updateMissionStatus(m.id, 'Atribuída', uid); return { ...m, status: 'Atribuída' as any, operadorId: uid }; }
        return null;
    };
    
    const deleteMission = async (id: string) => { 
        await executeAction(
            () => api.delete(`/missoes/${id}`),
            () => setMissoes(prev => prev.filter(m => m.id !== id))
        ); 
    };
    const revertMission = async (id: string) => { 
        await executeAction(
            () => api.put(`/missoes/${id}`, {status: 'Pendente', operadorId: null}),
            () => setMissoes(prev => prev.map(m => m.id === id ? {...m, status: 'Pendente'} as Missao : m))
        ); 
    };
    const revertMissionGroup = async (ids: string[]) => { for(const id of ids) await revertMission(id); };
    const assignFamilyMissionsToOperator = () => ({success: true});
    const getMyActivePickingGroup = (uid: string) => missoes.filter(m => m.operadorId === uid && m.status === 'Atribuída');

    const addIndustria = async (i: any) => { 
        await executeAction(
            () => api.post('/industrias', i),
            () => setIndustrias(prev => [...prev, {...i, id: generateId()}])
        ); 
    };
    const addIndustriasBatch = async (l: any[]) => { 
        await executeAction(
            () => api.post('/industrias/batch', l),
            () => setIndustrias(prev => [...prev, ...l.map(i => ({...i, id: generateId()}))])
        ); 
    };
    const updateIndustria = async (i: any) => { 
        await executeAction(
            () => api.put(`/industrias/${i.id}`, i),
            () => setIndustrias(prev => prev.map(ind => ind.id === i.id ? i : ind))
        ); 
    };
    const deleteIndustria = async (id: string) => { 
        await executeAction(
            () => api.delete(`/industrias/${id}`),
            () => setIndustrias(prev => prev.filter(i => i.id !== id))
        );
        return true; 
    };
    
    const addUser = async (u: any) => { 
        await executeAction(
            () => api.post('/users', u),
            () => setUsers(prev => [...prev, {...u, id: generateId()}])
        );
        return {success:true}; 
    };
    const registerUser = async (u: any) => { 
        const userData = {...u, profileId: OPERADOR_PROFILE_ID, status: UserStatus.ATIVO};
        await executeAction(
            () => api.post('/users', userData),
            () => setUsers(prev => [...prev, {...userData, id: generateId()}])
        );
        return {success:true}; 
    };
    const updateUser = async (u: any) => { 
        await executeAction(
            () => api.put(`/users/${u.id}`, u),
            () => setUsers(prev => prev.map(usr => usr.id === u.id ? u : usr))
        );
        return {success:true}; 
    };
    const deleteUser = async (id: string) => { 
        await executeAction(
            () => api.delete(`/users/${id}`),
            () => setUsers(prev => prev.filter(u => u.id !== id))
        );
        return {success:true}; 
    };

    const addProfile = async (p: any) => { 
        await executeAction(
            () => api.post('/profiles', p),
            () => setProfiles(prev => [...prev, {...p, id: generateId()}])
        );
        return {success:true}; 
    };
    const updateProfile = async (p: any) => { 
        await executeAction(
            () => api.put(`/profiles/${p.id}`, p),
            () => setProfiles(prev => prev.map(pr => pr.id === p.id ? p : pr))
        );
        return {success:true}; 
    };
    const deleteProfile = async (id: string) => { 
        await executeAction(
            () => api.delete(`/profiles/${id}`),
            () => setProfiles(prev => prev.filter(p => p.id !== id))
        );
        return {success:true}; 
    };

    // Funções locais (que ainda não têm backend ou não precisam)
    const addPalletConsolidado = (p:any) => { setPalletsConsolidados(prev=>[...prev, {...p, id: generateId()}]); return p; };
    const getDivergenciasByRecebimento = (rid: string) => divergencias.filter(d => d.recebimentoId === rid);
    const addDivergencia = async (d: any) => setDivergencias(prev => [...prev, {...d, id: generateId(), createdAt: new Date().toISOString()}]);
    const deleteDivergencia = async (id: string) => setDivergencias(prev => prev.filter(d => d.id !== id));
    const addTipoBloqueio = (t:any) => { setTiposBloqueio(prev=>[...prev, {...t, id: generateId()}]); return {success:true}};
    const updateTipoBloqueio = (t:any) => { setTiposBloqueio(prev=>prev.map(tp=>tp.id===t.id?t:tp)); return {success:true}};
    const deleteTipoBloqueio = (id:string) => { setTiposBloqueio(prev=>prev.filter(t=>t.id!==id)); return {success:true}};
    const startInventoryCount = (f: any, l: any[]) => { const s = {id: generateId(), createdAt: new Date().toISOString(), status: 'Em Andamento', filters: f, totalLocations: l.length, locationsCounted: 0} as InventoryCountSession; setInventoryCountSessions(prev => [...prev, s]); return s; };
    const recordCountItem = (i: any) => { setInventoryCountItems(prev => [...prev, {...i, id: generateId()}]); setInventoryCountSessions(prev => prev.map(s => s.id === i.sessionId ? {...s, locationsCounted: s.locationsCounted + 1} : s)); };
    const undoLastCount = () => {};
    const finishInventoryCount = (sid: string) => setInventoryCountSessions(prev => prev.map(s => s.id === sid ? {...s, status: 'Concluído'} : s));
    const getCountItemsBySession = (sid: string) => inventoryCountItems.filter(i => i.sessionId === sid);
    const startConferencia = (pid: string, cid: string) => { const c = {id: generateId(), pedidoId: pid, conferenteId: cid, startedAt: new Date().toISOString(), status: 'Em Andamento'} as Conferencia; setConferencias(prev => [...prev, c]); return c; };
    const getActiveConferencia = (cid: string) => { const c = conferencias.find(co => co.conferenteId === cid && co.status === 'Em Andamento'); return c ? {conferencia: c, pedido: pedidos.find(p => p.id === c.pedidoId)!} : null; };
    const finishConferencia = (cid: string, q: any) => { setConferencias(prev => prev.map(c => c.id === cid ? {...c, status: 'Concluída'} : c)); return {message: "Conferência Finalizada"}; };
    const logEvent = (actionType: AuditActionType, entity: AuditLog['entity'], entityId: string, details: string, metadata?: any) => { console.log(`[AUDIT] ${actionType} ${entity} ${entityId}: ${details}`); };
    const performFullPalletWriteOff = (etiquetaId: string, motivo: string, userId: string) => { return {success: true}; };
    
    // --- AUTO-RESSUPRIMENTO INTELIGENTE ---
    const checkReplenishmentNeeds = (skuId: string) => {
        // 1. Verifica estoque no Picking
        const pickingSlots = enderecos.filter(e => e.tipo === EnderecoTipo.PICKING);
        const skuPickingStock = etiquetas.filter(e => 
            e.skuId === skuId && 
            pickingSlots.some(p => p.id === e.enderecoId)
        );

        const totalPickingQty = skuPickingStock.reduce((acc, e) => acc + (e.quantidadeCaixas || 0), 0);
        const sku = skus.find(s => s.id === skuId);
        
        const maxCapacity = sku ? sku.totalCaixas : 100; 
        // Pega configuração global ou usa padrão
        const thresholdQty = maxCapacity * (appConfig.replenishmentThreshold / 100);

        // 2. Se abaixo do nível, cria missão
        if (totalPickingQty <= thresholdQty) {
            // Busca o melhor pallet na armazenagem (FEFO)
            const stockInStorage = etiquetas.filter(e => 
                e.skuId === skuId && 
                e.status === EtiquetaStatus.ARMAZENADA &&
                enderecos.find(addr => addr.id === e.enderecoId)?.tipo === EnderecoTipo.ARMAZENAGEM
            ).sort((a, b) => {
                const dateA = a.validade ? new Date(a.validade).getTime() : 0;
                const dateB = b.validade ? new Date(b.validade).getTime() : 0;
                return dateA - dateB;
            });

            if (stockInStorage.length > 0) {
                const sourcePallet = stockInStorage[0];
                // Tenta achar um endereço de picking vazio ou com o mesmo SKU
                const targetSlot = pickingSlots.find(e => e.status === EnderecoStatus.LIVRE) || pickingSlots.find(e => etiquetas.some(et => et.enderecoId === e.id && et.skuId === skuId));

                if (targetSlot) {
                    // Evita duplicar missão para o mesmo SKU
                    const pendingMissions = missoes.filter(m => 
                        m.tipo === MissaoTipo.REABASTECIMENTO && 
                        m.skuId === skuId && 
                        m.status !== 'Concluída'
                    );

                    if (pendingMissions.length === 0) {
                        createMission({
                            tipo: MissaoTipo.REABASTECIMENTO,
                            etiquetaId: sourcePallet.id,
                            skuId: skuId,
                            quantidade: sourcePallet.quantidadeCaixas || 0,
                            origemId: sourcePallet.enderecoId!,
                            destinoId: targetSlot.id,
                            prioridadeScore: 100 
                        });
                        logEvent(AuditActionType.REPLENISHMENT_TRIGGER, 'Missão', 'AUTO', `Ressuprimento automático gerado para SKU ${sku?.sku}`);
                    }
                }
            }
        }
    };

    const reportPickingShortage = () => {};
    const saveImportTemplate = (t: any) => setImportTemplates(prev => [...prev, {...t, id: generateId()}]);
    const deleteImportTemplate = (id: string) => setImportTemplates(prev => prev.filter(t => t.id !== id));
    const processImportFile = async (data: any[], template: ImportTemplate, filename: string, simulate: boolean) => { return {success: true, logId: '1', total: data.length, errors: []}; };
    const savePrinterConfig = (c: any) => setPrinterConfig(c);
    const generatePalletLabelZPL = () => "^XA^FDTest^XZ";
    const processTransportData = async () => ({success: true, message: "OK"});

    const value = {
        isLoading, isOffline, connectionError: isOffline ? 'Modo Offline' : null,
        skus, addSku, addSkusBatch, updateSku, deleteSku,
        enderecos, addEndereco, addEnderecosBatch, updateEndereco, deleteEndereco,
        industrias, addIndustria, addIndustriasBatch, updateIndustria, deleteIndustria,
        recebimentos, addRecebimento, updateRecebimento,
        etiquetas, getEtiquetaById, updateEtiqueta, addEtiqueta, deleteEtiqueta, deleteEtiquetas, getEtiquetasByRecebimento, getEtiquetasPendentesApontamento, apontarEtiqueta, armazenarEtiqueta, getBestPutawayAddress,
        pedidos, addPedidos, updatePedido, reabrirSeparacao, generateMissionsForPedido, processTransportData,
        missoes, createMission, createPickingMissions, updateMissionStatus, assignNextMission, deleteMission, revertMission, revertMissionGroup, assignFamilyMissionsToOperator, getMyActivePickingGroup,
        users, addUser, registerUser, updateUser, deleteUser,
        profiles, addProfile, updateProfile, deleteProfile,
        auditLogs, logEvent,
        palletsConsolidados, addPalletConsolidado,
        divergencias, getDivergenciasByRecebimento, addDivergencia, deleteDivergencia,
        tiposBloqueio, addTipoBloqueio, updateTipoBloqueio, deleteTipoBloqueio,
        inventoryCountSessions, inventoryCountItems, startInventoryCount, recordCountItem, undoLastCount, finishInventoryCount, getCountItemsBySession,
        conferencias, conferenciaItems, conferenciaErros, startConferencia, getActiveConferencia, finishConferencia,
        pickingConfig, setPickingConfig,
        appConfig, setAppConfig,
        performFullPalletWriteOff, checkReplenishmentNeeds, validateMovement, reportPickingShortage,
        importTemplates, saveImportTemplate, deleteImportTemplate, importLogs, processImportFile,
        printerConfig, savePrinterConfig, generatePalletLabelZPL, calculateAndApplyABCClassification
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
