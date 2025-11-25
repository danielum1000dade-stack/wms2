import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { 
    SKU, Endereco, Recebimento, Etiqueta, Pedido, Missao, PalletConsolidado, 
    EtiquetaStatus, MissaoTipo, EnderecoTipo, Industria, Divergencia, 
    EnderecoStatus, User, UserStatus, Profile, 
    InventoryCountSession, InventoryCountItem, SKUStatus,
    TipoBloqueio,
    Conferencia, ConferenciaItem, ConferenciaErro,
    AuditLog, AuditActionType,
    ImportTemplate, ImportLog,
    PrinterConfig
} from '../types';

// Interfaces
declare const XLSX: any;

const OPERADOR_PROFILE_ID = 'operador_profile';

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
    connectionError: string | null;
    
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

export const WMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Estados de Controle
    const [isLoading, setIsLoading] = useState(true);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Estados de Dados
    const [skus, setSkus] = useState<SKU[]>([]);
    const [enderecos, setEnderecos] = useState<Endereco[]>([]);
    const [industrias, setIndustrias] = useState<Industria[]>([]);
    const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
    const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [missoes, setMissoes] = useState<Missao[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    
    // Estados locais
    const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
    const [tiposBloqueio, setTiposBloqueio] = useState<TipoBloqueio[]>([]);
    const [importTemplates, setImportTemplates] = useState<ImportTemplate[]>([]);
    const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
    const [inventoryCountSessions, setInventoryCountSessions] = useState<InventoryCountSession[]>([]);
    const [inventoryCountItems, setInventoryCountItems] = useState<InventoryCountItem[]>([]);
    const [palletsConsolidados, setPalletsConsolidados] = useState<PalletConsolidado[]>([]);
    const [conferencias, setConferencias] = useState<Conferencia[]>([]);
    const [conferenciaItems, setConferenciaItems] = useState<ConferenciaItem[]>([]);
    const [conferenciaErros, setConferenciaErros] = useState<ConferenciaErro[]>([]);
    
    const [appConfig, setAppConfig] = useState({ replenishmentThreshold: 25 });
    const [pickingConfig, setPickingConfig] = useState({ allowPickingFromAnyAddress: false });
    const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({ type: 'PDF_FALLBACK' });

    // CARREGAR DADOS DO MYSQL AO INICIAR
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
            
            setConnectionError(null);
        } catch (error) {
            console.error("Erro ao conectar com o servidor MySQL.", error);
            setConnectionError("Não foi possível conectar ao servidor (localhost:3001). Verifique se o Backend está rodando.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); 
        return () => clearInterval(interval);
    }, []);

    const generateId = () => new Date().getTime().toString();

    // --- ACTIONS (WRAPPER SEGURO) ---
    const safeApiCall = async (apiCall: () => Promise<any>) => {
        try {
            const result = await apiCall();
            refreshData();
            return result;
        } catch (e) {
            console.error("API Error", e);
            throw e;
        }
    };

    const addSku = async (sku: Omit<SKU, 'id'>) => { await safeApiCall(() => api.post('/skus', { ...sku, status: SKUStatus.ATIVO })); };
    const addSkusBatch = async (newSkus: Omit<SKU, 'id'>[]) => { 
        const skusWithStatus = newSkus.map(s => ({...s, status: SKUStatus.ATIVO, id: generateId()}));
        await safeApiCall(() => api.post('/skus/batch', skusWithStatus)); 
    };
    const updateSku = async (sku: SKU) => { await safeApiCall(() => api.put(`/skus/${sku.id}`, sku)); };
    const deleteSku = async (id: string) => {
        if (etiquetas.some(e => e.skuId === id)) return false;
        await safeApiCall(() => api.delete(`/skus/${id}`));
        return true;
    };
    const calculateAndApplyABCClassification = () => ({success: true, message: "Calculado"});

    const addEndereco = async (endereco: Omit<Endereco, 'id'>) => { await safeApiCall(() => api.post('/enderecos', { ...endereco, status: EnderecoStatus.LIVRE })); };
    const addEnderecosBatch = async (list: any[]) => { await safeApiCall(() => api.post('/enderecos/batch', list.map(e => ({...e, id: generateId(), status: EnderecoStatus.LIVRE})))); }
    const updateEndereco = async (e: Endereco) => { await safeApiCall(() => api.put(`/enderecos/${e.id}`, e)); };
    const deleteEndereco = async (id: string) => { await safeApiCall(() => api.delete(`/enderecos/${id}`)); };

    const addRecebimento = async (r: any, qtdEtiquetas: number) => {
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
            console.error(e);
            return { newRecebimento: {} as any, newEtiquetas: [] };
        }
    };

    const updateRecebimento = async (r: Recebimento) => { await safeApiCall(() => api.put(`/recebimentos/${r.id}`, r)); };

    const addEtiqueta = async (data: any) => { const res = await safeApiCall(() => api.post('/etiquetas', { id: `INV-${generateId()}`, ...data })); return res.data; };
    const updateEtiqueta = async (e: Etiqueta) => { await safeApiCall(() => api.put(`/etiquetas/${e.id}`, e)); }
    const deleteEtiqueta = async (id: string) => { await safeApiCall(() => api.delete(`/etiquetas/${id}`)); return {success: true}; };
    const deleteEtiquetas = async (ids: string[]) => { 
        for (const id of ids) await api.delete(`/etiquetas/${id}`);
        refreshData(); 
        return {success: true}; 
    };

    const apontarEtiqueta = async (id: string, data: any) => {
        const sku = skus.find(s => s.id === data.skuId);
        if(!sku) return { success: false, message: "SKU Invalido" };
        await safeApiCall(() => api.put(`/etiquetas/${id}`, { ...data, status: EtiquetaStatus.APONTADA, dataApontamento: new Date().toISOString() }));
        return { success: true };
    };
    const armazenarEtiqueta = async (id: string, enderecoId: string) => {
        const end = enderecos.find(e => e.id === enderecoId);
        if(!end) return { success: false, message: "Endereço inválido" };
        const et = etiquetas.find(e => e.id === id);
        const val = validateMovement(et!, end);
        if (!val.success) return val;
        if(et?.enderecoId) await api.put(`/enderecos/${et.enderecoId}`, { status: EnderecoStatus.LIVRE });
        await api.put(`/enderecos/${enderecoId}`, { status: EnderecoStatus.OCUPADO });
        await safeApiCall(() => api.put(`/etiquetas/${id}`, { enderecoId, status: EtiquetaStatus.ARMAZENADA, dataArmazenagem: new Date().toISOString() }));
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

    const addPedidos = async (lista: any[]) => { await safeApiCall(() => api.post('/pedidos/batch', lista)); };
    const updatePedido = async (id: string, data: any) => { await safeApiCall(() => api.put(`/pedidos/${id}`, data)); };
    const reabrirSeparacao = (id: string, motivo: string) => { 
        updatePedido(id, { status: 'Pendente' });
        return {success: true, message: "Pedido reaberto."}; 
    };
    
    const generateMissionsForPedido = (pid: string) => {
        const p = pedidos.find(ped => ped.id === pid);
        if(!p) return {success: false, message: "Pedido não encontrado"};
        p.items.forEach(async (item: any) => {
            const sku = skus.find(s => s.sku === item.sku);
            if(sku) {
                const stock = etiquetas.find(e => e.skuId === sku.id && e.status === EtiquetaStatus.ARMAZENADA);
                if(stock && stock.enderecoId) {
                    await api.post('/missoes', {
                        tipo: MissaoTipo.PICKING, pedidoId: pid, etiquetaId: stock.id,
                        skuId: sku.id, quantidade: item.quantidadeCaixas, origemId: stock.enderecoId,
                        destinoId: 'STAGE', status: 'Pendente'
                    });
                }
            }
        });
        updatePedido(pid, { status: 'Em Separação' });
        return { success: true, message: "Gerado" };
    };

    const createMission = async (m: any) => { const res = await safeApiCall(() => api.post('/missoes', { ...m, status: 'Pendente' })); return res.data; };
    const createPickingMissions = (p: Pedido) => generateMissionsForPedido(p.id);

    const updateMissionStatus = async (id: string, status: string, operadorId?: string) => {
        await safeApiCall(() => api.put(`/missoes/${id}`, { status, operadorId }));
    };

    const assignNextMission = (uid: string) => {
        const m = missoes.find(ms => ms.status === 'Pendente');
        if(m) { updateMissionStatus(m.id, 'Atribuída', uid); return { ...m, status: 'Atribuída' as any, operadorId: uid }; }
        return null;
    };
    
    const deleteMission = async (id: string) => { await safeApiCall(() => api.delete(`/missoes/${id}`)); };
    const revertMission = async (id: string) => { await safeApiCall(() => api.put(`/missoes/${id}`, {status: 'Pendente', operadorId: null})); };
    const revertMissionGroup = async (ids: string[]) => { for(const id of ids) await revertMission(id); };
    const assignFamilyMissionsToOperator = () => ({success: true});
    const getMyActivePickingGroup = (uid: string) => missoes.filter(m => m.operadorId === uid && m.status === 'Atribuída');

    const addIndustria = async (i: any) => { await safeApiCall(() => api.post('/industrias', i)); };
    const addIndustriasBatch = async (l: any[]) => { await safeApiCall(() => api.post('/industrias/batch', l)); };
    const updateIndustria = async (i: any) => { await safeApiCall(() => api.put(`/industrias/${i.id}`, i)); };
    const deleteIndustria = async (id: string) => { await safeApiCall(() => api.delete(`/industrias/${id}`)); return true; };
    
    const addUser = async (u: any) => { await safeApiCall(() => api.post('/users', u)); return {success:true}; };
    const registerUser = async (u: any) => { await safeApiCall(() => api.post('/users', {...u, profileId: OPERADOR_PROFILE_ID, status: UserStatus.ATIVO})); return {success:true}; };
    const updateUser = async (u: any) => { await safeApiCall(() => api.put(`/users/${u.id}`, u)); return {success:true}; };
    const deleteUser = async (id: string) => { await safeApiCall(() => api.delete(`/users/${id}`)); return {success:true}; };

    const addProfile = async (p: any) => { await safeApiCall(() => api.post('/profiles', p)); return {success:true}; };
    const updateProfile = async (p: any) => { await safeApiCall(() => api.put(`/profiles/${p.id}`, p)); return {success:true}; };
    const deleteProfile = async (id: string) => { await safeApiCall(() => api.delete(`/profiles/${id}`)); return {success:true}; };

    // Mock functions for local state not yet in DB
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
    const checkReplenishmentNeeds = () => {};
    const reportPickingShortage = () => {};
    const saveImportTemplate = (t: any) => setImportTemplates(prev => [...prev, {...t, id: generateId()}]);
    const deleteImportTemplate = (id: string) => setImportTemplates(prev => prev.filter(t => t.id !== id));
    const processImportFile = async (data: any[], template: ImportTemplate, filename: string, simulate: boolean) => { return {success: true, logId: '1', total: data.length, errors: []}; };
    const savePrinterConfig = (c: any) => setPrinterConfig(c);
    const generatePalletLabelZPL = () => "^XA^FDTest^XZ";
    const processTransportData = async () => ({success: true, message: "OK"});

    const value = {
        isLoading, connectionError,
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