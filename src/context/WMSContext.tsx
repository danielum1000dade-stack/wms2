
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Importar o serviço API
import { 
    SKU, Endereco, Recebimento, Etiqueta, Pedido, Missao, PalletConsolidado, 
    EtiquetaStatus, MissaoTipo, EnderecoTipo, Industria, Divergencia, 
    EnderecoStatus, User, UserStatus, Profile, Permission,
    InventoryCountSession, InventoryCountItem, SKUStatus,
    TipoBloqueio,
    Conferencia, ConferenciaItem, ConferenciaErro,
    AuditLog, AuditActionType,
    ImportTemplate, ImportLog, ImportTransformation, WMSFieldEnum,
    PrinterConfig
} from '../types';

// Manter o fallback de mocks/local apenas para coisas não migradas no setup básico
// Para simplificar a migração, vamos focar nas entidades principais no banco SQL.

interface WMSContextType {
    // Dados Principais (Vindos do MySQL)
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

    // Métodos Async (Agora chamam API)
    addSku: (sku: Omit<SKU, 'id'>) => Promise<void>;
    updateSku: (sku: SKU) => Promise<void>;
    deleteSku: (id: string) => Promise<boolean>;
    
    addEndereco: (endereco: Omit<Endereco, 'id'>) => Promise<void>;
    addEnderecosBatch: (enderecos: Omit<Endereco, 'id'>[]) => Promise<void>;
    updateEndereco: (endereco: Endereco) => Promise<void>;
    deleteEndereco: (id: string) => Promise<void>;

    addRecebimento: (recebimentoData: Omit<Recebimento, 'id'>, etiquetasCount: number) => Promise<{ newRecebimento: Recebimento, newEtiquetas: Etiqueta[] }>;
    updateRecebimento: (recebimento: Recebimento) => Promise<void>;

    addEtiqueta: (etiquetaData: Partial<Etiqueta>) => Promise<Etiqueta>;
    updateEtiqueta: (etiqueta: Etiqueta) => Promise<void>;
    deleteEtiqueta: (id: string) => Promise<{ success: boolean, message?: string }>;
    deleteEtiquetas: (ids: string[]) => Promise<{ success: boolean }>;
    apontarEtiqueta: (id: string, data: Partial<Etiqueta>) => Promise<{ success: boolean, message?: string, warnings?: string[] }>;
    armazenarEtiqueta: (id: string, enderecoId: string) => Promise<{ success: boolean, message?: string }>;

    // Helpers e Lógicas de Negócio (Mantidos no Front ou migrados parcialmente)
    getEtiquetaById: (id: string) => Etiqueta | undefined;
    getEtiquetasByRecebimento: (recebimentoId: string) => Etiqueta[];
    getEtiquetasPendentesApontamento: () => Etiqueta[];
    getBestPutawayAddress: (etiqueta: Etiqueta) => any | null;
    
    addPedidos: (pedidos: Pedido[]) => Promise<void>;
    updatePedido: (pedidoId: string, data: Partial<Omit<Pedido, 'id'>>) => Promise<void>;
    reabrirSeparacao: (pedidoId: string, motivo: string) => { success: boolean, message: string };
    generateMissionsForPedido: (pedidoId: string) => { success: boolean; message: string; };
    
    createMission: (missionData: Omit<Missao, 'id' | 'status' | 'createdAt'>) => Promise<Missao>;
    updateMissionStatus: (missionId: string, status: Missao['status'], operadorId?: string, completedQuantity?: number) => Promise<void>;
    assignNextMission: (operadorId: string) => Missao | null;

    // ... Manter o restante das interfaces (simplificado para a migração) ...
    [key: string]: any; 
}

const WMSContext = createContext<WMSContextType | undefined>(undefined);

export const WMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Estados (agora alimentados pela API)
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
    
    // Estados locais (ainda não migrados para SQL nesta fase 1)
    const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
    const [tiposBloqueio, setTiposBloqueio] = useState<TipoBloqueio[]>([]);
    const [importTemplates, setImportTemplates] = useState<ImportTemplate[]>([]);
    const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
    const [inventoryCountSessions, setInventoryCountSessions] = useState<InventoryCountSession[]>([]);
    const [inventoryCountItems, setInventoryCountItems] = useState<InventoryCountItem[]>([]);
    
    const [appConfig, setAppConfig] = useState({ replenishmentThreshold: 25 });
    const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({ type: 'PDF_FALLBACK' });

    // CARREGAR DADOS DO MYSQL AO INICIAR
    const refreshData = async () => {
        try {
            const [rSkus, rEnderecos, rIndustrias, rRecebimentos, rEtiquetas, rPedidos, rMissoes, rUsers, rProfiles] = await Promise.all([
                api.get('/skus'),
                api.get('/enderecos'),
                api.get('/industrias'),
                api.get('/recebimentos'),
                api.get('/etiquetas'),
                api.get('/pedidos'),
                api.get('/missoes'),
                api.get('/users'),
                api.get('/profiles')
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
        } catch (error) {
            console.error("Erro ao conectar com o servidor MySQL. Verifique se o backend está rodando.", error);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); // Polling simples para manter sincronizado
        return () => clearInterval(interval);
    }, []);

    const generateId = () => new Date().getTime().toString(); // Fallback ID se precisar no front antes do save

    // --- ACTIONS (MIGRADOS PARA API) ---

    const addSku = async (sku: Omit<SKU, 'id'>) => {
        await api.post('/skus', { ...sku, status: SKUStatus.ATIVO });
        refreshData();
    };
    const updateSku = async (sku: SKU) => {
        await api.put(`/skus/${sku.id}`, sku);
        refreshData();
    };
    const deleteSku = async (id: string) => {
        if (etiquetas.some(e => e.skuId === id)) return false;
        await api.delete(`/skus/${id}`);
        refreshData();
        return true;
    };

    const addEndereco = async (endereco: Omit<Endereco, 'id'>) => {
        await api.post('/enderecos', { ...endereco, status: EnderecoStatus.LIVRE });
        refreshData();
    };
    const addEnderecosBatch = async (list: any[]) => {
        await api.post('/enderecos/batch', list.map(e => ({...e, id: generateId(), status: 'Livre'}))); // Prisma createMany
        refreshData();
    }
    const updateEndereco = async (e: Endereco) => {
        await api.put(`/enderecos/${e.id}`, e);
        refreshData();
    };
    const deleteEndereco = async (id: string) => {
        await api.delete(`/enderecos/${id}`);
        refreshData();
    };

    const addRecebimento = async (r: any, qtdEtiquetas: number) => {
        // Criar Recebimento
        const resRec = await api.post('/recebimentos', { ...r, dataHoraChegada: new Date().toISOString(), status: 'Aguardando' });
        const newRecebimento = resRec.data;

        // Gerar Etiquetas
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
    };

    const updateRecebimento = async (r: Recebimento) => {
        await api.put(`/recebimentos/${r.id}`, r);
        refreshData();
    };

    // --- ETIQUETAS ---
    const addEtiqueta = async (data: any) => {
        const res = await api.post('/etiquetas', { id: `INV-${generateId()}`, ...data });
        refreshData();
        return res.data;
    };
    const updateEtiqueta = async (e: Etiqueta) => {
        await api.put(`/etiquetas/${e.id}`, e);
        refreshData();
    }
    const apontarEtiqueta = async (id: string, data: any) => {
        const sku = skus.find(s => s.id === data.skuId);
        if(!sku) return { success: false, message: "SKU Invalido" };
        
        await api.put(`/etiquetas/${id}`, { 
            ...data, 
            status: EtiquetaStatus.APONTADA,
            dataApontamento: new Date().toISOString()
        });
        refreshData();
        return { success: true };
    };
    const armazenarEtiqueta = async (id: string, enderecoId: string) => {
        const end = enderecos.find(e => e.id === enderecoId);
        if(!end) return { success: false };

        // Atualizar Endereço anterior para LIVRE
        const et = etiquetas.find(e => e.id === id);
        if(et?.enderecoId) {
            await api.put(`/enderecos/${et.enderecoId}`, { status: EnderecoStatus.LIVRE });
        }

        // Atualizar Novo Endereço para OCUPADO
        await api.put(`/enderecos/${enderecoId}`, { status: EnderecoStatus.OCUPADO });

        // Atualizar Etiqueta
        await api.put(`/etiquetas/${id}`, {
            enderecoId,
            status: EtiquetaStatus.ARMAZENADA,
            dataArmazenagem: new Date().toISOString()
        });
        
        refreshData();
        return { success: true };
    };

    // --- Helpers ---
    const getEtiquetaById = (id: string) => etiquetas.find(e => e.id === id);
    const getEtiquetasByRecebimento = (id: string) => etiquetas.filter(e => e.recebimentoId === id);
    const getEtiquetasPendentesApontamento = () => etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO);

    // --- Logic (IA Putaway Simples) ---
    const getBestPutawayAddress = (etiqueta: Etiqueta) => {
        const sku = skus.find(s => s.id === etiqueta.skuId);
        if (!sku) return null;
        // Simple logic: find first free address compatible
        const livre = enderecos.find(e => e.status === EnderecoStatus.LIVRE && e.tipo === EnderecoTipo.ARMAZENAGEM);
        if(livre) return { endereco: livre, score: 100, reason: "Livre" };
        return null;
    };

    // --- PEDIDOS & MISSOES ---
    const addPedidos = async (lista: any[]) => {
        await api.post('/pedidos/batch', lista);
        refreshData();
    };
    const updatePedido = async (id: string, data: any) => {
        await api.put(`/pedidos/${id}`, data);
        refreshData();
    };
    
    const generateMissionsForPedido = (pid: string) => {
        const p = pedidos.find(ped => ped.id === pid);
        if(!p) return {success: false, message: "Pedido não encontrado"};
        
        // Lógica simplificada de geração
        p.items.forEach(async (item: any) => {
            const sku = skus.find(s => s.sku === item.sku);
            if(sku) {
                // Encontrar estoque (FIFO simples para demo)
                const stock = etiquetas.find(e => e.skuId === sku.id && e.status === EtiquetaStatus.ARMAZENADA);
                if(stock && stock.enderecoId) {
                    await createMission({
                        tipo: MissaoTipo.PICKING,
                        pedidoId: pid,
                        etiquetaId: stock.id,
                        skuId: sku.id,
                        quantidade: item.quantidadeCaixas,
                        origemId: stock.enderecoId,
                        destinoId: 'STAGE'
                    } as any);
                }
            }
        });
        
        updatePedido(pid, { status: 'Em Separação' });
        return { success: true, message: "Missões geradas (Simulação)" };
    };

    const createMission = async (m: any) => {
        const res = await api.post('/missoes', { ...m, status: 'Pendente' });
        refreshData();
        return res.data;
    };

    const updateMissionStatus = async (id: string, status: string, operadorId?: string, completedQty?: number) => {
        const updateData: any = { status };
        if(operadorId) updateData.operadorId = operadorId;
        await api.put(`/missoes/${id}`, updateData);
        
        // Se concluiu picking, baixar estoque
        if(status === 'Concluída') {
            const m = missoes.find(mis => mis.id === id);
            if(m && m.tipo === MissaoTipo.PICKING) {
                const et = etiquetas.find(e => e.id === m.etiquetaId);
                if(et) {
                    const novaQtd = Math.max(0, (et.quantidadeCaixas || 0) - (completedQty || m.quantidade));
                    await updateEtiqueta({ ...et, quantidadeCaixas: novaQtd });
                }
            }
        }
        refreshData();
    };

    const assignNextMission = (uid: string) => {
        const m = missoes.find(ms => ms.status === 'Pendente');
        if(m) {
            updateMissionStatus(m.id, 'Atribuída', uid);
            return { ...m, status: 'Atribuída' as any, operadorId: uid };
        }
        return null;
    };

    // Placeholders para manter compatibilidade com o resto do código UI sem quebrar
    // Estas funções ainda rodam em memória local do componente ou precisam ser migradas depois
    const addIndustria = async (i: any) => { await api.post('/industrias', i); refreshData(); return i; };
    const addIndustriasBatch = async (l: any[]) => { await api.post('/industrias/batch', l); refreshData(); };
    const updateIndustria = async (i: any) => { await api.put(`/industrias/${i.id}`, i); refreshData(); };
    const deleteIndustria = async (id: string) => { await api.delete(`/industrias/${id}`); refreshData(); return true; };
    
    const addUser = async (u: any) => { await api.post('/users', u); refreshData(); return {success:true}; };
    const registerUser = async (u: any) => { await api.post('/users', {...u, profileId: 'operador', status: 'Ativo'}); refreshData(); return {success:true}; };
    const updateUser = async (u: any) => { await api.put(`/users/${u.id}`, u); refreshData(); return {success:true}; };
    const deleteUser = async (id: string) => { await api.delete(`/users/${id}`); refreshData(); return {success:true}; };

    const addProfile = async (p: any) => { await api.post('/profiles', p); refreshData(); return {success:true}; };
    const updateProfile = async (p: any) => { await api.put(`/profiles/${p.id}`, p); refreshData(); return {success:true}; };
    const deleteProfile = async (id: string) => { await api.delete(`/profiles/${id}`); refreshData(); return {success:true}; };

    // Métodos auxiliares não-migrados (Mock para evitar erros de compilação nas páginas)
    const reabrirSeparacao = () => ({success: true, message: "Mock"});
    const deleteEtiqueta = async (id: string) => { await api.delete(`/etiquetas/${id}`); refreshData(); return {success: true}; };
    const deleteEtiquetas = async () => ({success: true});
    const createPickingMissions = () => {};
    const deleteMission = () => {};
    const revertMission = () => {};
    const revertMissionGroup = () => {};
    const assignFamilyMissionsToOperator = () => ({success: true});
    const getMyActivePickingGroup = () => null;
    const addPalletConsolidado = () => ({} as any);
    const getDivergenciasByRecebimento = (rid: string) => divergencias.filter(d => d.recebimentoId === rid);
    const addDivergencia = async (d: any) => setDivergencias(prev => [...prev, {...d, id: generateId()}]);
    const deleteDivergencia = async (id: string) => setDivergencias(prev => prev.filter(d => d.id !== id));
    const addTipoBloqueio = (t:any) => { setTiposBloqueio(prev=>[...prev, {...t, id: generateId()}]); return {success:true}};
    const updateTipoBloqueio = (t:any) => { setTiposBloqueio(prev=>prev.map(tp=>tp.id===t.id?t:tp)); return {success:true}};
    const deleteTipoBloqueio = (id:string) => { setTiposBloqueio(prev=>prev.filter(t=>t.id!==id)); return {success:true}};
    const startInventoryCount = (f: any, l: any[]) => { const s = {id: generateId(), createdAt: new Date().toISOString(), status: 'Em Andamento', filters: f, totalLocations: l.length, locationsCounted: 0} as InventoryCountSession; setInventoryCountSessions(prev => [...prev, s]); return s; };
    const recordCountItem = (i: any) => { setInventoryCountItems(prev => [...prev, {...i, id: generateId()}]); setInventoryCountSessions(prev => prev.map(s => s.id === i.sessionId ? {...s, locationsCounted: s.locationsCounted + 1} : s)); };
    const undoLastCount = () => {};
    const finishInventoryCount = (sid: string) => setInventoryCountSessions(prev => prev.map(s => s.id === sid ? {...s, status: 'Concluído'} : s));
    const getCountItemsBySession = (sid: string) => inventoryCountItems.filter(i => i.sessionId === sid);
    const startConferencia = () => ({} as any);
    const getActiveConferencia = () => null;
    const finishConferencia = () => ({message: "ok"});
    const logEvent = () => {};
    const performFullPalletWriteOff = () => ({success: true});
    const checkReplenishmentNeeds = () => {};
    const validateMovement = () => ({success: true});
    const reportPickingShortage = () => {};
    const saveImportTemplate = (t: any) => setImportTemplates(prev => [...prev, t]);
    const deleteImportTemplate = () => {};
    const processImportFile = async () => ({success: true, logId: '1', total: 0, errors: []});
    const savePrinterConfig = (c: any) => setPrinterConfig(c);
    const generatePalletLabelZPL = () => "";
    const calculateAndApplyABCClassification = () => ({success: true, message: "OK"});
    const processTransportData = async () => ({success: true, message: "OK"});

    const value = {
        skus, addSku, updateSku, deleteSku,
        enderecos, addEndereco, addEnderecosBatch, updateEndereco, deleteEndereco,
        industrias, addIndustria, addIndustriasBatch, updateIndustria, deleteIndustria,
        recebimentos, addRecebimento, updateRecebimento,
        etiquetas, getEtiquetaById, updateEtiqueta, addEtiqueta, deleteEtiqueta, deleteEtiquetas, getEtiquetasByRecebimento, getEtiquetasPendentesApontamento, apontarEtiqueta, armazenarEtiqueta, getBestPutawayAddress,
        pedidos, addPedidos, updatePedido, reabrirSeparacao, generateMissionsForPedido, processTransportData,
        missoes, createMission, createPickingMissions, updateMissionStatus, assignNextMission, deleteMission, revertMission, revertMissionGroup, assignFamilyMissionsToOperator, getMyActivePickingGroup,
        users, addUser, registerUser, updateUser, deleteUser,
        profiles, addProfile, updateProfile, deleteProfile,
        auditLogs, logEvent,
        // Fallbacks / Mocks para não quebrar UI
        palletsConsolidados: [], addPalletConsolidado,
        divergencias, getDivergenciasByRecebimento, addDivergencia, deleteDivergencia,
        tiposBloqueio, addTipoBloqueio, updateTipoBloqueio, deleteTipoBloqueio,
        inventoryCountSessions, inventoryCountItems, startInventoryCount, recordCountItem, undoLastCount, finishInventoryCount, getCountItemsBySession,
        conferencias: [], conferenciaItems: [], conferenciaErros: [], startConferencia, getActiveConferencia, finishConferencia,
        pickingConfig: {}, setPickingConfig: () => {},
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
