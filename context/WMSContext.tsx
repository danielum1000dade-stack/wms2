import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
    SKU, Endereco, Recebimento, Etiqueta, Pedido, Missao, PalletConsolidado, 
    EtiquetaStatus, MissaoTipo, EnderecoTipo, Industria, Divergencia, 
    EnderecoStatus, User, UserStatus, Profile, Permission,
    InventoryCountSession, InventoryCountItem
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
    apontarEtiqueta: (id: string, data: Partial<Etiqueta>) => void;
    armazenarEtiqueta: (id: string, enderecoId: string) => { success: boolean, message?: string };
    pedidos: Pedido[];
    addPedidos: (pedidos: Pedido[]) => void;
    missoes: Missao[];
    createPickingMissions: (pedido: Pedido) => void;
    createMission: (missionData: Omit<Missao, 'id' | 'status'>) => Missao;
    palletsConsolidados: PalletConsolidado[];
    addPalletConsolidado: (pallet: Omit<PalletConsolidado, 'id'>) => PalletConsolidado;
    divergencias: Divergencia[];
    getDivergenciasByRecebimento: (recebimentoId: string) => Divergencia[];
    addDivergencia: (divergencia: Omit<Divergencia, 'id'>) => void;
    deleteDivergencia: (id: string) => void;
    users: User[];
    addUser: (user: Omit<User, 'id'>) => { success: boolean, message?: string };
    updateUser: (user: User) => { success: boolean, message?: string };
    deleteUser: (id: string) => { success: boolean, message?: string };
    profiles: Profile[];
    addProfile: (profile: Omit<Profile, 'id'>) => { success: boolean, message?: string };
    updateProfile: (profile: Profile) => { success: boolean, message?: string };
    deleteProfile: (id: string) => { success: boolean, message?: string };
    inventoryCountSessions: InventoryCountSession[];
    inventoryCountItems: InventoryCountItem[];
    startInventoryCount: (filters: InventoryCountSession['filters'], locations: Endereco[]) => InventoryCountSession;
    recordCountItem: (itemData: Omit<InventoryCountItem, 'id'>) => void;
    undoLastCount: (sessionId: string) => void;
    finishInventoryCount: (sessionId: string) => void;
    getCountItemsBySession: (sessionId: string) => InventoryCountItem[];
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
    const [inventoryCountSessions, setInventoryCountSessions] = useLocalStorage<InventoryCountSession[]>('wms_inventory_sessions', []);
    const [inventoryCountItems, setInventoryCountItems] = useLocalStorage<InventoryCountItem[]>('wms_inventory_items', []);


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
    
    const addEtiqueta = (etiquetaData: Partial<Etiqueta>): Etiqueta => {
        const nfPart = 'INV';
        const lastEtiquetaNum = etiquetas.reduce((max, e) => {
            const parts = e.id.split('-');
            if (parts.length > 1) {
                const num = parseInt(parts[parts.length - 1], 10);
                return isNaN(num) ? max : Math.max(max, num);
            }
            return max;
        }, 0);
        const newId = `P${nfPart}-${(lastEtiquetaNum + 1).toString().padStart(5, '0')}`;

        const newEtiqueta: Etiqueta = {
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
        
        setEtiquetas(prev => [...prev, newEtiqueta]);
        
        if (newEtiqueta.enderecoId) {
            setEnderecos(prev => prev.map(e => e.id === newEtiqueta.enderecoId ? { ...e, status: EnderecoStatus.OCUPADO } : e));
        }

        return newEtiqueta;
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

    const armazenarEtiqueta = (id: string, enderecoId: string): { success: boolean; message?: string } => {
        const etiqueta = getEtiquetaById(id);
        const enderecoDestino = enderecos.find(e => e.id === enderecoId);

        if (!etiqueta) {
            const message = "Armazenagem inválida: Etiqueta não encontrada.";
            console.error(message, { id });
            return { success: false, message };
        }
        if (!enderecoDestino) {
            const message = "Armazenagem inválida: Endereço de destino não encontrado.";
            console.error(message, { enderecoId });
            return { success: false, message };
        }
         if (enderecoDestino.status !== EnderecoStatus.LIVRE) {
            const message = `Armazenagem inválida: Endereço ${enderecoDestino.nome} não está livre. Status: ${enderecoDestino.status}.`;
            console.error(message, { enderecoDestino });
            return { success: false, message };
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

        return { success: true };
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

    const createMission = (missionData: Omit<Missao, 'id' | 'status'>): Missao => {
        const newMission: Missao = {
            ...missionData,
            id: `M-${generateId()}`,
            status: 'Pendente',
        };
        setMissoes(prev => [...prev, newMission]);
        return newMission;
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
        
        // Update session progress
        setInventoryCountSessions(prev => prev.map(session => {
            if (session.id === itemData.sessionId) {
                return { ...session, locationsCounted: session.locationsCounted + 1 };
            }
            return session;
        }));
    };
    
    const undoLastCount = (sessionId: string) => {
        const sessionItems = inventoryCountItems
            .filter(item => item.sessionId === sessionId)
            .sort((a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime());

        if (sessionItems.length === 0) return;

        const lastItemId = sessionItems[0].id;
        
        setInventoryCountItems(prev => prev.filter(item => item.id !== lastItemId));

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


    const value = {
        skus, addSku, addSkusBatch, updateSku, deleteSku,
        enderecos, addEndereco, addEnderecosBatch, updateEndereco, deleteEndereco,
        industrias, addIndustria, addIndustriasBatch, updateIndustria, deleteIndustria,
        recebimentos, addRecebimento, updateRecebimento,
        etiquetas, getEtiquetaById, updateEtiqueta, addEtiqueta, deleteEtiqueta, deleteEtiquetas, getEtiquetasByRecebimento, getEtiquetasPendentesApontamento, apontarEtiqueta, armazenarEtiqueta,
        pedidos, addPedidos,
        missoes, createPickingMissions, createMission,
        palletsConsolidados, addPalletConsolidado,
        divergencias, getDivergenciasByRecebimento, addDivergencia, deleteDivergencia,
        users, addUser, updateUser, deleteUser,
        profiles, addProfile, updateProfile, deleteProfile,
        inventoryCountSessions, inventoryCountItems, startInventoryCount, recordCountItem, undoLastCount, finishInventoryCount, getCountItemsBySession
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