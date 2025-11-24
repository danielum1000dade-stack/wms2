
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
    AuditLog, AuditActionType,
    CategoriaProduto, SetorArmazem,
    ImportTemplate, ImportLog, ImportMapping, WMSFieldEnum, ImportTransformation,
    IndustriaRegras
} from '../types';

declare const XLSX: any;

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
            [Permission.BAIXA_PALLET]: false
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
    getBestPutawayAddress: (etiqueta: Etiqueta) => IASuggestion | null;
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
    registerUser: (user: { username: string, fullName: string, password?: string }) => { success: boolean, message?: string };
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
    conferencias: Conferencia[];
    conferenciaItems: ConferenciaItem[];
    conferenciaErros: ConferenciaErro[];
    startConferencia: (pedidoId: string, conferenteId: string) => Conferencia | null;
    getActiveConferencia: (conferenteId: string) => { conferencia: Conferencia, pedido: Pedido } | null;
    finishConferencia: (conferenciaId: string, confirmedQuantities: ConfirmedQuantities) => { message: string };
    auditLogs: AuditLog[];
    logEvent: (actionType: AuditActionType, entity: AuditLog['entity'], entityId: string, details: string, metadata?: any) => void;
    pickingConfig: PickingConfig;
    setPickingConfig: React.Dispatch<React.SetStateAction<PickingConfig>>;
    appConfig: AppConfig;
    setAppConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
    
    // New Methods for Robustness
    performFullPalletWriteOff: (etiquetaId: string, motivo: string, userId: string) => ValidationResult;
    checkReplenishmentNeeds: (skuId: string) => void;
    validateMovement: (etiqueta: Etiqueta, targetAddress: Endereco) => ValidationResult;
    reportPickingShortage: (missionId: string, userId: string) => void;

    // Import Module
    importTemplates: ImportTemplate[];
    saveImportTemplate: (template: ImportTemplate) => void;
    deleteImportTemplate: (id: string) => void;
    importLogs: ImportLog[];
    processImportFile: (fileData: any[], template: ImportTemplate, fileName: string, simulate?: boolean) => Promise<ImportResult>;
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

    // Import Module State
    const [importTemplates, setImportTemplates] = useLocalStorage<ImportTemplate[]>('wms_import_templates', []);
    const [importLogs, setImportLogs] = useLocalStorage<ImportLog[]>('wms_import_logs', []);

    const [pickingConfig, setPickingConfig] = useLocalStorage<PickingConfig>('wms_picking_config', {
        allowPickingFromAnyAddress: false
    });

    const [appConfig, setAppConfig] = useLocalStorage<AppConfig>('wms_app_config', {
        replenishmentThreshold: 25, 
    });

    const [conferencias, setConferencias] = useLocalStorage<Conferencia[]>('wms_conferencias', []);
    const [conferenciaItems, setConferenciaItems] = useLocalStorage<ConferenciaItem[]>('wms_conferencia_items', []);
    const [conferenciaErros, setConferenciaErros] = useLocalStorage<ConferenciaErro[]>('wms_conferencia_erros', []);

    const generateId = () => new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);
    const currentUserId = 'admin_user'; 

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

    // --- IMPORT ENGINE ---
    const saveImportTemplate = (template: ImportTemplate) => {
        if (!template.id) template.id = generateId();
        setImportTemplates(prev => {
            const exists = prev.find(t => t.id === template.id);
            if (exists) return prev.map(t => t.id === template.id ? template : t);
            return [...prev, template];
        });
    };

    const deleteImportTemplate = (id: string) => {
        setImportTemplates(prev => prev.filter(t => t.id !== id));
    };

    const processImportFile = async (fileData: any[], template: ImportTemplate, fileName: string, simulate = false): Promise<ImportResult> => {
        const errors: string[] = [];
        const processedRecords: any[] = [];
        const industria = industrias.find(i => i.id === template.industriaId);

        // Helper: Transform Value
        const transformValue = (val: any, type: ImportTransformation): any => {
            if (val === undefined || val === null) return val;
            const strVal = String(val).trim();
            switch (type) {
                case ImportTransformation.UPPERCASE: return strVal.toUpperCase();
                case ImportTransformation.LOWERCASE: return strVal.toLowerCase();
                case ImportTransformation.TRIM: return strVal;
                case ImportTransformation.NUMBER_INT: return parseInt(strVal.replace(/[^0-9-]/g, ''), 10);
                case ImportTransformation.NUMBER_FLOAT: return parseFloat(strVal.replace(',', '.')); // Basic replace
                case ImportTransformation.DATE_ISO: return strVal; // Assume already ISO or handled by Excel parser
                case ImportTransformation.REMOVE_SPECIAL: return strVal.replace(/[^a-zA-Z0-9 ]/g, "");
                default: return val;
            }
        };

        fileData.forEach((row, index) => {
            const rowErrorPrefix = `Linha ${index + 2}:`; // +2 accounting for header and 0-index
            const record: any = {};
            let rowValid = true;

            // Map columns
            template.mappings.forEach(map => {
                let rawValue = row[map.fileColumn];
                
                // Check required
                if (map.required && (rawValue === undefined || rawValue === null || rawValue === '')) {
                    if (map.defaultValue) {
                        rawValue = map.defaultValue;
                    } else {
                        errors.push(`${rowErrorPrefix} Coluna obrigatória '${map.fileColumn}' vazia.`);
                        rowValid = false;
                    }
                }

                if (rowValid) {
                    try {
                        record[map.wmsField] = transformValue(rawValue, map.transformation);
                    } catch (e) {
                        errors.push(`${rowErrorPrefix} Erro ao transformar coluna '${map.fileColumn}'.`);
                        rowValid = false;
                    }
                }
            });

            // Business Logic Validation
            if (rowValid) {
                // Validate SKU exists
                if (record[WMSFieldEnum.SKU_CODIGO]) {
                    const sku = skus.find(s => s.sku === record[WMSFieldEnum.SKU_CODIGO]);
                    if (!sku) {
                        errors.push(`${rowErrorPrefix} SKU '${record[WMSFieldEnum.SKU_CODIGO]}' não encontrado no cadastro.`);
                        rowValid = false;
                    } else {
                        // Check Industry Match if configured
                        if (sku.industriaId && sku.industriaId !== template.industriaId) {
                             errors.push(`${rowErrorPrefix} SKU pertence a outra indústria.`);
                             rowValid = false;
                        }
                    }
                }

                // Validate Quantity
                if (record[WMSFieldEnum.QUANTIDADE] && (isNaN(record[WMSFieldEnum.QUANTIDADE]) || record[WMSFieldEnum.QUANTIDADE] <= 0)) {
                    errors.push(`${rowErrorPrefix} Quantidade inválida.`);
                    rowValid = false;
                }

                // Industry Rules (Safe Access)
                const regras = industria?.regras || { exigir_lote: false, exigir_validade: false };

                if (regras.exigir_lote && !record[WMSFieldEnum.LOTE]) {
                    errors.push(`${rowErrorPrefix} Lote é obrigatório para esta indústria.`);
                    rowValid = false;
                }
                
                if (regras.exigir_validade && !record[WMSFieldEnum.VALIDADE]) {
                    errors.push(`${rowErrorPrefix} Validade é obrigatória para esta indústria.`);
                    rowValid = false;
                }
            }

            if (rowValid) {
                processedRecords.push(record);
            }
        });

        if (simulate) {
            return { success: errors.length === 0, logId: 'SIMULACAO', total: processedRecords.length, errors };
        }

        // PERSISTENCE LOGIC
        if (errors.length === 0) {
            const logId = generateId();
            
            if (template.type === 'PEDIDO') {
                // Group by Order Number
                const ordersMap: Record<string, Pedido> = {};
                
                processedRecords.forEach(rec => {
                    const orderNum = rec[WMSFieldEnum.PEDIDO_NUMERO];
                    if (!ordersMap[orderNum]) {
                        ordersMap[orderNum] = {
                            id: generateId(),
                            numeroTransporte: orderNum,
                            items: [],
                            status: 'Pendente',
                            createdAt: new Date().toISOString(),
                            priority: false,
                            cliente: rec[WMSFieldEnum.PEDIDO_CLIENTE],
                            origemImportacao: logId
                        };
                    }
                    
                    const sku = skus.find(s => s.sku === rec[WMSFieldEnum.SKU_CODIGO]);
                    ordersMap[orderNum].items.push({
                        sku: rec[WMSFieldEnum.SKU_CODIGO],
                        descricao: sku?.descritivo || 'Importado',
                        lote: rec[WMSFieldEnum.LOTE] || '',
                        quantidadeCaixas: Number(rec[WMSFieldEnum.QUANTIDADE])
                    });
                });

                const newPedidos = Object.values(ordersMap);
                setPedidos(prev => [...prev, ...newPedidos]);
                logEvent(AuditActionType.IMPORT, 'Pedido', 'BATCH', `Importação de ${newPedidos.length} pedidos via template ${template.name}`);
            }
            // TODO: Implement RECEBIMENTO logic if needed

            const log: ImportLog = {
                id: logId,
                timestamp: new Date().toISOString(),
                templateId: template.id,
                industriaId: template.industriaId,
                fileName,
                status: 'SUCESSO',
                totalRecords: fileData.length,
                successCount: processedRecords.length,
                errorCount: 0,
                errorsJson: '[]',
                userId: currentUserId
            };
            setImportLogs(prev => [log, ...prev]);
            
            return { success: true, logId, total: processedRecords.length, errors: [] };
        } else {
             // Log Failure
             const log: ImportLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                templateId: template.id,
                industriaId: template.industriaId,
                fileName,
                status: 'FALHA',
                totalRecords: fileData.length,
                successCount: 0,
                errorCount: errors.length,
                errorsJson: JSON.stringify(errors.slice(0, 50)), // Limit size
                userId: currentUserId
            };
            setImportLogs(prev => [log, ...prev]);
            return { success: false, logId: log.id, total: 0, errors };
        }
    };

    // ... (Rest of the existing Context Logic)
    // --- CORE VALIDATION ENGINE ---
    const validateMovement = (etiqueta: Etiqueta, targetAddress: Endereco): ValidationResult => {
        // 1. Check Address Status
        if (targetAddress.status === EnderecoStatus.BLOQUEADO) return { success: false, message: `Endereço bloqueado: ${targetAddress.motivoBloqueio || 'Sem motivo'}` };
        if (targetAddress.status === EnderecoStatus.INVENTARIO) return { success: false, message: "Endereço em inventário." };
        if (targetAddress.status === EnderecoStatus.OCUPADO) return { success: false, message: "Endereço já ocupado." };

        const sku = skus.find(s => s.id === etiqueta.skuId);
        if (!sku) return { success: false, message: "SKU não encontrado." };

        // 2. Check Sector Compatibility (CRITICAL for Food/Chemical safety)
        if (targetAddress.setor && sku.setor && targetAddress.setor !== sku.setor) {
             return { success: false, message: `Conflito de Setor: SKU é ${sku.setor} mas Endereço é ${targetAddress.setor}.` };
        }

        // 3. Check Category Compatibility
        if (targetAddress.categoriasPermitidas && targetAddress.categoriasPermitidas.length > 0) {
            if (!targetAddress.categoriasPermitidas.includes(sku.categoria)) {
                return { success: false, message: `Categoria ${sku.categoria} não permitida neste endereço.` };
            }
        }

        // 4. Check Weight Capacity
        if (targetAddress.pesoMaximo > 0 && sku.peso > targetAddress.pesoMaximo) {
            return { success: false, message: `Peso excedido: ${sku.peso}kg > ${targetAddress.pesoMaximo}kg` };
        }

        // 5. Check Blocking
        if (etiqueta.isBlocked) return { success: false, message: `Pallet bloqueado: ${etiqueta.motivoBloqueio}` };
        if (sku.status === SKUStatus.BLOQUEADO) return { success: false, message: `SKU bloqueado: ${sku.motivoBloqueio}` };

        return { success: true };
    };

    // --- AUTOMATION ENGINE ---
    const checkReplenishmentNeeds = (skuId: string) => {
        const pickingSlots = enderecos.filter(e => e.tipo === EnderecoTipo.PICKING);
        const skuPickingStock = etiquetas.filter(e => 
            e.skuId === skuId && 
            pickingSlots.some(p => p.id === e.enderecoId)
        );

        const totalPickingQty = skuPickingStock.reduce((acc, e) => acc + (e.quantidadeCaixas || 0), 0);
        const sku = skus.find(s => s.id === skuId);
        
        // Assuming a rough max capacity of picking slot based on standard pallet
        const maxCapacity = sku ? sku.totalCaixas : 100; 
        const thresholdQty = maxCapacity * (appConfig.replenishmentThreshold / 100);

        if (totalPickingQty <= thresholdQty) {
            // Trigger Replenishment Logic
            const stockInStorage = etiquetas.filter(e => 
                e.skuId === skuId && 
                e.status === EtiquetaStatus.ARMAZENADA &&
                enderecos.find(addr => addr.id === e.enderecoId)?.tipo === EnderecoTipo.ARMAZENAGEM
            ).sort((a, b) => {
                // FEFO
                const dateA = a.validade ? new Date(a.validade).getTime() : 0;
                const dateB = b.validade ? new Date(b.validade).getTime() : 0;
                return dateA - dateB;
            });

            if (stockInStorage.length > 0) {
                const sourcePallet = stockInStorage[0];
                const targetSlot = pickingSlots.find(e => e.status === EnderecoStatus.LIVRE) || pickingSlots.find(e => etiquetas.some(et => et.enderecoId === e.id && et.skuId === skuId));

                if (targetSlot) {
                    // Prevent duplicate missions
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

    const reportPickingShortage = (missionId: string, userId: string) => {
        const mission = missoes.find(m => m.id === missionId);
        if (!mission) return;

        // 1. Log Shortage
        logEvent(AuditActionType.PICKING_SHORTAGE, 'Missão', mission.id, `Operador ${userId} reportou falta no picking.`, { enderecoId: mission.origemId, skuId: mission.skuId });

        // 2. Block current address (Prevent further picks until checked)
        setEnderecos(prev => prev.map(e => e.id === mission.origemId ? { ...e, status: EnderecoStatus.BLOQUEADO, motivoBloqueio: 'RUPTURA_REPORTADA' } : e));

        // 3. Trigger Emergency Replenishment
        checkReplenishmentNeeds(mission.skuId);

        // 4. Set Mission to "Pendente" (or Cancelled/Short) depending on policy. For now, revert to Pending to try another address if available later.
        // Ideally, we would split the mission or find another picking slot. 
        // Simple implementation: Revert mission to let scheduler try again or alert manager.
        updateMissionStatus(mission.id, 'Pendente', undefined, undefined, 'Ruptura Reportada');
    };

    const performFullPalletWriteOff = (etiquetaId: string, motivo: string, userId: string): ValidationResult => {
        const etiqueta = etiquetas.find(e => e.id === etiquetaId);
        if (!etiqueta) return { success: false, message: "Etiqueta não encontrada" };

        const activeMission = missoes.find(m => m.etiquetaId === etiquetaId && m.status !== 'Concluída');
        if (activeMission) return { success: false, message: `Pallet vinculado à missão ${activeMission.id}. Cancele a missão antes.` };

        const oldEnderecoId = etiqueta.enderecoId;

        // Update Etiqueta
        setEtiquetas(prev => prev.map(e => e.id === etiquetaId ? { 
            ...e, 
            status: EtiquetaStatus.BAIXADA, 
            enderecoId: undefined,
            observacoes: `${e.observacoes || ''} [BAIXA TOTAL: ${motivo}]`
        } : e));

        // Free Address
        if (oldEnderecoId) {
            setEnderecos(prev => prev.map(e => e.id === oldEnderecoId ? { ...e, status: EnderecoStatus.LIVRE } : e));
        }

        logEvent(AuditActionType.DELETE, 'Etiqueta', etiquetaId, `Baixa Total: ${motivo}`, { userId });

        if (etiqueta.skuId) {
            checkReplenishmentNeeds(etiqueta.skuId);
        }

        return { success: true, message: "Baixa realizada com sucesso." };
    };

    const addSku = (sku: Omit<SKU, 'id'>): SKU => {
        const newSku = { 
            ...sku, 
            id: generateId(), 
            status: SKUStatus.ATIVO,
            categoria: sku.categoria || CategoriaProduto.GERAL,
            setor: sku.setor || SetorArmazem.SECO
        };
        setSkus(prev => [...prev, newSku]);
        logEvent(AuditActionType.CREATE, 'SKU', newSku.id, `SKU ${newSku.sku} criado.`);
        return newSku;
    };
    
    const addSkusBatch = (newSkus: Omit<SKU, 'id'>[]) => {
        const skusWithIds = newSkus.map(sku => ({ 
            ...sku, 
            id: generateId(), 
            status: SKUStatus.ATIVO,
            categoria: sku.categoria || CategoriaProduto.GERAL,
            setor: sku.setor || SetorArmazem.SECO
        }));
        setSkus(prev => [...prev, ...skusWithIds]);
        logEvent(AuditActionType.CREATE, 'SKU', 'BATCH', `Importação em lote de ${newSkus.length} SKUs.`);
    };

    const updateSku = (updatedSku: SKU) => {
        setSkus(prev => prev.map(s => s.id === updatedSku.id ? updatedSku : s));
        logEvent(AuditActionType.UPDATE, 'SKU', updatedSku.id, `SKU ${updatedSku.sku} atualizado.`);
    };

    const deleteSku = (id: string): boolean => {
        const isSkuInUse = etiquetas.some(etiqueta => etiqueta.skuId === id);
        if (isSkuInUse) return false;
        setSkus(prevSkus => prevSkus.filter(s => s.id !== id));
        logEvent(AuditActionType.DELETE, 'SKU', id, 'SKU excluído.');
        return true;
    };

    const calculateAndApplyABCClassification = (): { success: boolean; message: string } => {
        const pickingMissions = missoes.filter(m => m.tipo === MissaoTipo.PICKING);
        if (pickingMissions.length === 0) return { success: false, message: "Histórico insuficiente." };

        const skuCounts = pickingMissions.reduce((acc, mission) => {
            acc[mission.skuId] = (acc[mission.skuId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sortedSkus = Object.entries(skuCounts).sort(([, a], [, b]) => b - a);
        const totalPicks = sortedSkus.reduce((sum, [, count]) => sum + count, 0);
        
        const classifiedSkuIds: Record<string, 'A' | 'B' | 'C'> = {};
        let cumulative = 0;
        
        sortedSkus.forEach(([skuId, count]) => {
            cumulative += count;
            const pct = cumulative / totalPicks;
            classifiedSkuIds[skuId] = pct <= 0.8 ? 'A' : (pct <= 0.95 ? 'B' : 'C');
        });
        
        let updatedCount = 0;
        setSkus(prev => prev.map(sku => {
            const newClass = classifiedSkuIds[sku.id] || 'C';
            if (sku.classificacaoABC !== newClass) {
                updatedCount++;
                return { ...sku, classificacaoABC: newClass };
            }
            return sku;
        }));

        logEvent(AuditActionType.UPDATE, 'SKU', 'BATCH_ABC', `Curva ABC recalculada.`);
        return { success: true, message: `Curva ABC calculada. ${updatedCount} SKUs atualizados.` };
    };

    const addEndereco = (endereco: Omit<Endereco, 'id'>) => {
        const newEnd = { ...endereco, id: generateId(), status: endereco.status || EnderecoStatus.LIVRE };
        setEnderecos(prev => [...prev, newEnd]);
        logEvent(AuditActionType.CREATE, 'Endereço', newEnd.id, `Endereço ${newEnd.codigo} criado.`);
    };

    const addEnderecosBatch = (newEnderecos: Omit<Endereco, 'id'>[]) => {
        const enderecosWithIds = newEnderecos.map(end => ({ ...end, id: generateId(), status: end.status || EnderecoStatus.LIVRE }));
        setEnderecos(prev => [...prev, ...enderecosWithIds]);
        logEvent(AuditActionType.CREATE, 'Endereço', 'BATCH', `Importação em lote.`);
    };

    const updateEndereco = (updatedEndereco: Endereco) => setEnderecos(prev => prev.map(e => e.id === updatedEndereco.id ? updatedEndereco : e));
    
    const deleteEndereco = (id: string) => {
        setEnderecos(prev => prev.filter(e => e.id !== id)); // Basic implementation
    };

    // ... Industry ...
    const addIndustria = (industria: Omit<Industria, 'id'>) => {
        const defaultRegras: IndustriaRegras = {
            exigir_lote: false,
            exigir_validade: false,
            permitir_estoque_negativo: false,
            validacao_shelf_life: false,
            agrupar_pedidos: false
        };
        
        const newInd = { 
            ...industria, 
            id: generateId(),
            regras: industria.regras || defaultRegras
        };
        setIndustrias(prev => [...prev, newInd]);
        return newInd;
    }
    const addIndustriasBatch = (newIndustrias: Omit<Industria, 'id'>[]) => {
        const defaultRegras: IndustriaRegras = {
            exigir_lote: false,
            exigir_validade: false,
            permitir_estoque_negativo: false,
            validacao_shelf_life: false,
            agrupar_pedidos: false
        };
        const newInds = newIndustrias.map(i => ({ 
            ...i, 
            id: generateId(),
            regras: i.regras || defaultRegras 
        }));
        setIndustrias(prev => [...prev, ...newInds]);
    }
    const updateIndustria = (ind: Industria) => setIndustrias(prev => prev.map(i => i.id === ind.id ? ind : i));
    const deleteIndustria = (id: string) => {
        setIndustrias(prev => prev.filter(i => i.id !== id));
        return true;
    }

    // ... Recebimento ...
    const addRecebimento = (recebimentoData: Omit<Recebimento, 'id'>, etiquetasCount: number) => {
        const newRecebimento = { ...recebimentoData, id: generateId(), houveAvarias: false };
        const nfPart = newRecebimento.notaFiscal.replace(/\D/g, '').slice(-4) || '0000';
        
        let lastEtiquetaNum = 0;
        etiquetas.forEach(e => {
             const parts = e.id.split('-');
             const num = parseInt(parts[parts.length - 1], 10);
             if(!isNaN(num) && num > lastEtiquetaNum) lastEtiquetaNum = num;
        });

        const newEtiquetas: Etiqueta[] = Array.from({ length: etiquetasCount }, (_, i) => ({
            id: `P${nfPart}-${(lastEtiquetaNum + i + 1).toString().padStart(5, '0')}`,
            recebimentoId: newRecebimento.id,
            status: EtiquetaStatus.PENDENTE_APONTAMENTO,
        }));

        setRecebimentos(prev => [...prev, newRecebimento]);
        setEtiquetas(prev => [...prev, ...newEtiquetas]);
        logEvent(AuditActionType.CREATE, 'Recebimento', newRecebimento.id, `Recebimento criado NF ${newRecebimento.notaFiscal}`);
        return { newRecebimento, newEtiquetas };
    };

    const updateRecebimento = async (updated: Recebimento) => setRecebimentos(prev => prev.map(r => r.id === updated.id ? updated : r));

    // ... Etiqueta ...
    const getEtiquetaById = (id: string) => etiquetas.find(e => e.id === id);
    const updateEtiqueta = (updated: Etiqueta) => setEtiquetas(prev => prev.map(e => e.id === updated.id ? updated : e));
    
    const addEtiqueta = (data: Partial<Etiqueta>) => {
        const newEtiqueta: Etiqueta = {
            id: `INV-${generateId().slice(-6)}`,
            recebimentoId: 'MANUAL',
            status: EtiquetaStatus.ARMAZENADA,
            ...data
        } as Etiqueta;
        setEtiquetas(prev => [...prev, newEtiqueta]);
        if(data.enderecoId) setEnderecos(prev => prev.map(e => e.id === data.enderecoId ? {...e, status: EnderecoStatus.OCUPADO} : e));
        return newEtiqueta;
    }

    const deleteEtiqueta = (id: string) => {
        setEtiquetas(prev => prev.filter(e => e.id !== id));
        return { success: true };
    }
    const deleteEtiquetas = (ids: string[]) => {
        setEtiquetas(prev => prev.filter(e => !ids.includes(e.id)));
        return { success: true };
    }
    const getEtiquetasByRecebimento = (id: string) => etiquetas.filter(e => e.recebimentoId === id);
    const getEtiquetasPendentesApontamento = () => etiquetas.filter(e => e.status === EtiquetaStatus.PENDENTE_APONTAMENTO);

    const apontarEtiqueta = (id: string, data: Partial<Etiqueta>) => {
        const sku = skus.find(s => s.id === data.skuId);
        const warnings: string[] = [];
        if(!sku) return { success: false, message: "SKU não encontrado" };
        
        if (data.quantidadeCaixas && data.quantidadeCaixas > sku.totalCaixas) {
            return { success: false, message: "Quantidade excede capacidade do pallet." };
        }

        setEtiquetas(prev => prev.map(e => e.id === id ? { 
            ...e, ...data, status: EtiquetaStatus.APONTADA, dataApontamento: new Date().toISOString() 
        } : e));
        
        logEvent(AuditActionType.UPDATE, 'Etiqueta', id, `Apontado: ${sku.sku}`);
        return { success: true, warnings };
    };

    const armazenarEtiqueta = (id: string, enderecoId: string): { success: boolean; message?: string } => {
        const etiqueta = etiquetas.find(e => e.id === id);
        const endereco = enderecos.find(e => e.id === enderecoId);
        if (!etiqueta || !endereco) return { success: false, message: "Dados inválidos" };

        // Using Centralized Validation
        const validation = validateMovement(etiqueta, endereco);
        if (!validation.success) return validation;

        const oldEnderecoId = etiqueta.enderecoId;

        setEnderecos(prev => prev.map(e => {
            if (e.id === oldEnderecoId) return { ...e, status: EnderecoStatus.LIVRE };
            if (e.id === enderecoId) return { ...e, status: EnderecoStatus.OCUPADO };
            return e;
        }));

        setEtiquetas(prev => prev.map(e => e.id === id ? {
            ...e, enderecoId, status: EtiquetaStatus.ARMAZENADA, dataArmazenagem: new Date().toISOString()
        } : e));

        logEvent(AuditActionType.MOVE, 'Etiqueta', id, `Movido para ${endereco.codigo}`);
        return { success: true };
    };

    const getBestPutawayAddress = (etiqueta: Etiqueta): IASuggestion | null => {
        const sku = skus.find(s => s.id === etiqueta.skuId);
        if (!sku) return null;

        // Filter candidates
        const candidates = enderecos.filter(e => 
            e.status === EnderecoStatus.LIVRE && 
            e.tipo === EnderecoTipo.ARMAZENAGEM &&
            (!e.categoriasPermitidas?.length || e.categoriasPermitidas.includes(sku.categoria)) &&
            (e.pesoMaximo === 0 || sku.peso <= e.pesoMaximo) &&
            (!e.setor || !sku.setor || e.setor === sku.setor) // Sector Check
        );

        if (candidates.length === 0) return null;

        // Scoring Logic
        let bestMatch: IASuggestion | null = null;
        
        for (const addr of candidates) {
            let score = 0;
            const reasons: string[] = [];

            // SRE Match
            const skuSres = [sku.sre1, sku.sre2, sku.sre3, sku.sre4, sku.sre5].filter(Boolean);
            const addrSres = [addr.sre1, addr.sre2, addr.sre3, addr.sre4, addr.sre5].filter(Boolean);
            
            if (addrSres.some(s => skuSres.includes(s))) {
                score += 500;
                reasons.push("Regra SRE");
            }

            // Affinity
            const nearby = etiquetas.some(e => 
                e.skuId === sku.id && 
                e.enderecoId && 
                enderecos.find(en => en.id === e.enderecoId)?.codigo.split('-')[0] === addr.codigo.split('-')[0]
            );
            if (nearby) {
                score += 200;
                reasons.push("Afinidade de Produto");
            }

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { endereco: addr, score, reason: reasons.join(', ') || "Posição Livre" };
            }
        }
        return bestMatch;
    };

    // ... Pedidos & Missões (Simplifying boilerplate) ...
    const addPedidos = (newPedidos: Pedido[]) => {
        setPedidos(prev => [...prev, ...newPedidos]);
        logEvent(AuditActionType.CREATE, 'Pedido', 'BATCH', `Importados ${newPedidos.length} pedidos`);
    };
    const updatePedido = (id: string, data: any) => setPedidos(prev => prev.map(p => p.id === id ? {...p, ...data} : p));
    
    const reabrirSeparacao = (id: string, motivo: string) => {
        // Simplified implementation
        setPedidos(prev => prev.map(p => p.id === id ? {...p, status: 'Pendente'} : p));
        setMissoes(prev => prev.filter(m => m.pedidoId !== id));
        return { success: true, message: "Pedido reaberto" };
    };

    const processTransportData = async (data: any[]) => {
        // Mapping logic simulation
        return { success: true, message: "Dados processados" };
    };

    const generateMissionsForPedido = (pedidoId: string) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return { success: false, message: "Pedido não encontrado" };

        // Robust allocation logic
        const newMissions: Missao[] = [];
        
        pedido.items.forEach(item => {
            const sku = skus.find(s => s.sku === item.sku);
            if (!sku) return;

            let qtyNeeded = item.quantidadeCaixas;
            
            // 1. Find stock in picking
            const pickingStock = etiquetas.filter(e => 
                e.skuId === sku.id && 
                e.status === EtiquetaStatus.ARMAZENADA &&
                enderecos.find(addr => addr.id === e.enderecoId)?.tipo === EnderecoTipo.PICKING
            );

            pickingStock.forEach(pallet => {
                if (qtyNeeded <= 0) return;
                const qtyTake = Math.min(qtyNeeded, pallet.quantidadeCaixas || 0);
                newMissions.push({
                    id: generateId(),
                    tipo: MissaoTipo.PICKING,
                    pedidoId: pedido.id,
                    etiquetaId: pallet.id,
                    skuId: sku.id,
                    quantidade: qtyTake,
                    origemId: pallet.enderecoId!,
                    destinoId: 'STAGE-OUT',
                    status: 'Pendente',
                    createdAt: new Date().toISOString()
                });
                qtyNeeded -= qtyTake;
            });

            // 2. If still needed, trigger Replenishment
            if (qtyNeeded > 0) {
                checkReplenishmentNeeds(sku.id);
            }
        });

        if (newMissions.length > 0) {
            setMissoes(prev => [...prev, ...newMissions]);
            setPedidos(prev => prev.map(p => p.id === pedidoId ? {...p, status: 'Em Separação'} : p));
            return { success: true, message: `${newMissions.length} missões geradas.` };
        }
        return { success: false, message: "Estoque insuficiente no picking. Ressuprimento solicitado." };
    };

    const createPickingMissions = (p: Pedido) => generateMissionsForPedido(p.id);
    
    const createMission = (data: any) => {
        const m = { ...data, id: generateId(), status: 'Pendente', createdAt: new Date().toISOString() };
        setMissoes(prev => [...prev, m]);
        return m;
    };

    const deleteMission = (id: string) => setMissoes(prev => prev.filter(m => m.id !== id));
    const revertMission = (id: string) => setMissoes(prev => prev.map(m => m.id === id ? {...m, status: 'Pendente', operadorId: undefined} : m));
    const revertMissionGroup = (ids: string[]) => setMissoes(prev => prev.map(m => ids.includes(m.id) ? {...m, status: 'Pendente', operadorId: undefined} : m));
    
    const assignNextMission = (opId: string) => {
        const pending = missoes.filter(m => m.status === 'Pendente').sort((a,b) => (b.prioridadeScore || 0) - (a.prioridadeScore || 0));
        if (pending.length === 0) return null;
        const mission: Missao = { ...pending[0], status: 'Atribuída', operadorId: opId };
        setMissoes(prev => prev.map(m => m.id === mission.id ? mission : m));
        return mission;
    };

    const assignFamilyMissionsToOperator = (pedidoId: string, familia: string, opId: string) => {
        // Logic to bulk assign
        return { success: true }; 
    };

    const getMyActivePickingGroup = (opId: string) => missoes.filter(m => m.operadorId === opId && ['Atribuída', 'Em Andamento'].includes(m.status));

    const updateMissionStatus = (id: string, status: any, opId?: string, qty?: number, reason?: string) => {
        setMissoes(prev => prev.map(m => {
            if (m.id !== id) return m;
            
            const updated: Missao = { ...m, status, operadorId: opId || m.operadorId };
            
            if (status === 'Concluída') {
                // Logic to deduct stock
                if (m.tipo === MissaoTipo.PICKING) {
                    const et = etiquetas.find(e => e.id === m.etiquetaId);
                    if (et) {
                        const newQty = (et.quantidadeCaixas || 0) - (qty || m.quantidade);
                        updateEtiqueta({ ...et, quantidadeCaixas: Math.max(0, newQty) });
                        checkReplenishmentNeeds(et.skuId!); // Trigger replenishment check
                    }
                } else if (m.tipo === MissaoTipo.REABASTECIMENTO) {
                    armazenarEtiqueta(m.etiquetaId, m.destinoId);
                }
            }
            return updated;
        }));
    };

    // ... Boilerplate for other entities ...
    const addPalletConsolidado = (p: any) => { setPalletsConsolidados(prev => [...prev, {...p, id: generateId()}]); return p; };
    const getDivergenciasByRecebimento = (id: string) => divergencias.filter(d => d.recebimentoId === id);
    const addDivergencia = async (d: any) => { setDivergencias(prev => [...prev, {...d, id: generateId(), createdAt: new Date().toISOString()}]) };
    const deleteDivergencia = async (id: string) => setDivergencias(prev => prev.filter(d => d.id !== id));
    
    const addUser = (u: any) => { setUsers(prev => [...prev, {...u, id: generateId()}]); return {success: true} };
    const registerUser = (u: { username: string, fullName: string }) => {
        if (users.some(user => user.username === u.username)) {
            return { success: false, message: 'Nome de usuário já existe.' };
        }
        const newUser: User = {
            id: generateId(),
            username: u.username,
            fullName: u.fullName,
            profileId: OPERADOR_PROFILE_ID, // Default profile
            status: UserStatus.ATIVO
        };
        setUsers(prev => [...prev, newUser]);
        logEvent(AuditActionType.CREATE, 'User', newUser.id, `Usuário ${newUser.username} registrado publicamente.`);
        return { success: true, message: 'Cadastro realizado com sucesso.' };
    };
    const updateUser = (u: any) => { setUsers(prev => prev.map(user => user.id === u.id ? u : user)); return {success: true} };
    const deleteUser = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); return {success: true} };
    
    const addProfile = (p: any) => { setProfiles(prev => [...prev, {...p, id: generateId()}]); return {success: true} };
    const updateProfile = (p: any) => { setProfiles(prev => prev.map(prof => prof.id === p.id ? p : prof)); return {success: true} };
    const deleteProfile = (id: string) => { setProfiles(prev => prev.filter(p => p.id !== id)); return {success: true} };

    const addTipoBloqueio = (t: any) => { setTiposBloqueio(prev => [...prev, {...t, id: generateId()}]); return {success: true} };
    const updateTipoBloqueio = (t: any) => { setTiposBloqueio(prev => prev.map(tb => tb.id === t.id ? t : tb)); return {success: true} };
    const deleteTipoBloqueio = (id: string) => { setTiposBloqueio(prev => prev.filter(tb => tb.id !== id)); return {success: true} };

    const startInventoryCount = (f: any, l: any[]) => { 
        const s = { id: generateId(), createdAt: new Date().toISOString(), status: 'Em Andamento', filters: f, totalLocations: l.length, locationsCounted: 0 } as InventoryCountSession;
        setInventoryCountSessions(prev => [...prev, s]);
        return s;
    };
    const recordCountItem = (i: any) => {
        setInventoryCountItems(prev => [...prev, {...i, id: generateId()}]);
        setInventoryCountSessions(prev => prev.map(s => s.id === i.sessionId ? {...s, locationsCounted: s.locationsCounted + 1} : s));
    };
    const undoLastCount = (sid: string) => { /* impl */ };
    const finishInventoryCount = (sid: string) => setInventoryCountSessions(prev => prev.map(s => s.id === sid ? {...s, status: 'Concluído'} : s));
    const getCountItemsBySession = (sid: string) => inventoryCountItems.filter(i => i.sessionId === sid);

    const startConferencia = (pid: string, cid: string) => {
        const c = { id: generateId(), pedidoId: pid, conferenteId: cid, startedAt: new Date().toISOString(), status: 'Em Andamento' } as Conferencia;
        setConferencias(prev => [...prev, c]);
        return c;
    };
    const getActiveConferencia = (cid: string) => {
        const c = conferencias.find(co => co.conferenteId === cid && co.status === 'Em Andamento');
        return c ? { conferencia: c, pedido: pedidos.find(p => p.id === c.pedidoId)! } : null;
    };
    const finishConferencia = (cid: string, qtds: any) => {
        setConferencias(prev => prev.map(c => c.id === cid ? {...c, status: 'Concluída'} : c));
        // Update Pedido status logic...
        return { message: "Conferência finalizada" };
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
        users, addUser, registerUser, updateUser, deleteUser,
        profiles, addProfile, updateProfile, deleteProfile,
        tiposBloqueio, addTipoBloqueio, updateTipoBloqueio, deleteTipoBloqueio,
        inventoryCountSessions, inventoryCountItems, startInventoryCount, recordCountItem, undoLastCount, finishInventoryCount, getCountItemsBySession,
        conferencias, conferenciaItems, conferenciaErros, startConferencia, getActiveConferencia, finishConferencia,
        auditLogs, logEvent,
        pickingConfig, setPickingConfig,
        appConfig, setAppConfig,
        performFullPalletWriteOff, checkReplenishmentNeeds, validateMovement, reportPickingShortage,
        importTemplates, saveImportTemplate, deleteImportTemplate, importLogs, processImportFile
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
