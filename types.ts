export enum SKUStatus {
  ATIVO = 'Ativo',
  BLOQUEADO = 'Bloqueado'
}

export interface SKU {
  id: string;
  sku: string;
  descritivo: string;
  totalCaixas: number;
  tempoVida: number; // dias
  peso: number; // kg
  qtdPorCamada: number;
  camadaPorLastro: number;
  sre1: string;
  sre2: string;
  sre3: string;
  sre4: string;
  sre5: string;
  classificacao: string;
  familia: string;
  industriaId?: string;
  status: SKUStatus;
  motivoBloqueio?: string;
}

export interface Industria {
  id: string;
  nome: string;
}

export enum EnderecoTipo {
  ARMAZENAGEM = 'Armazenagem',
  PICKING = 'Picking',
  EXPEDICAO = 'Expedição',
  RECEBIMENTO = 'Recebimento',
  ANTECAMARA = 'Antecâmara'
}

export enum EnderecoStatus {
  LIVRE = 'Livre',
  OCUPADO = 'Ocupado',
  BLOQUEADO = 'Bloqueado',
}

export interface Endereco {
  id: string;
  codigo: string;
  nome: string;
  altura: number; // metros
  capacidade: number; // pallets
  tipo: EnderecoTipo;
  status: EnderecoStatus;
  sre1?: string;
  sre2?: string;
  sre3?: string;
  sre4?: string;
  sre5?: string;
  motivoBloqueio?: string;
  industriaId?: string;
}

export interface Recebimento {
    id: string;
    placaVeiculo: string;
    fornecedor: string;
    notaFiscal: string;
    temperaturaVeiculo: number;
    dataHoraChegada: string;
    etiquetasGeradas: number;
    // Campos adicionados para o romaneio
    transportador?: string;
    lacre?: string;
    doca?: string;
    dataPrevista?: string;
    horaPrevista?: string;
    horaInicioDescarga?: string;
    horaFimDescarga?: string;
    temperaturaTermoKing?: number;
    temperaturaInicio?: number;
    temperaturaMeio?: number;
    temperaturaFim?: number;
    houveAvarias?: boolean;
    responsavel?: string;
    motorista?: string;
}

export enum EtiquetaStatus {
    PENDENTE_APONTAMENTO = 'Pendente Apontamento',
    APONTADA = 'Apontada',
    ARMAZENADA = 'Armazenada',
    EM_SEPARACAO = 'Em Separação',
    CONFERIDA = 'Conferida',
    EXPEDIDA = 'Expedida',
}

export interface Etiqueta {
    id: string;
    recebimentoId: string;
    status: EtiquetaStatus;
    skuId?: string;
    quantidadeCaixas?: number;
    lote?: string;
    validade?: string;
    observacoes?: string;
    enderecoId?: string;
    dataApontamento?: string;
    dataArmazenagem?: string;
    dataExpedicao?: string;
    palletConsolidadoId?: string; // Para etiquetas de expedição
    isBlocked?: boolean;
    motivoBloqueio?: string;
}

export interface PedidoItem {
    sku: string;
    descricao: string;
    lote: string;
    quantidadeCaixas: number;
    // Campos do arquivo de transporte
    unidadeArmazem?: string;
    totalUnidVda?: number;
    unidExpFracao?: number;
    pesoBruto?: number;
    pesoLiquido?: number;
}

export interface Pedido {
    id: string;
    numeroTransporte: string;
    items: PedidoItem[];
    status: 'Pendente' | 'Em Separação' | 'Separado' | 'Conferido' | 'Expedido';
    createdAt: string;
}

export enum MissaoTipo {
    PICKING = 'Picking',
    REABASTECIMENTO = 'Reabastecimento',
    MOVIMENTACAO = 'Movimentação',
    MOVIMENTACAO_PALLET = 'Movimentação de Pallet',
    TRANSFERENCIA = 'Transferência',
    CONFERENCIA = 'Conferência',
}

export interface Missao {
    id: string;
    tipo: MissaoTipo;
    pedidoId?: string;
    etiquetaId: string;
    skuId: string;
    quantidade: number;
    origemId: string;
    destinoId: string;
    status: 'Pendente' | 'Atribuída' | 'Em Andamento' | 'Concluída';
    operadorId?: string;
    createdAt: string;
}

export interface PalletConsolidado {
  id: string;
  pedidoId: string;
  etiquetas: string[]; // array de IDs de etiquetas de produto
  quantidadeCaixasTotal: number;
  skusContidos: string[]; // array de IDs de SKU
}

export enum DivergenciaTipo {
    AVARIA = 'Avaria',
    FALTA = 'Falta',
    SOBRA = 'Sobra',
}

export interface Divergencia {
    id: string;
    recebimentoId: string;
    skuId: string;
    tipo: DivergenciaTipo;
    quantidade: number;
    observacao?: string;
}

// Inventory Count Types
export interface InventoryCountSession {
    id: string;
    createdAt: string;
    status: 'Em Andamento' | 'Concluído' | 'Cancelado';
    filters: {
        area: EnderecoTipo;
        corredor?: string;
        predio?: string;
        nivel?: string;
    };
    countedBy?: string; // User ID
    totalLocations: number;
    locationsCounted: number;
}

export interface InventoryCountItem {
    id: string;
    sessionId: string;
    enderecoId: string;
    expectedEtiquetaId: string | null;
    foundEtiquetaId: string | null;
    expectedSkuId: string | null;
    expectedQuantity: number | null;
    countedSkuId: string | null;
    countedLote: string | null;
    countedValidade: string | null;
    countedQuantity: number | null;
    discrepancy: number; // calculated: counted - expected
    countedAt: string;
    status: 'Pendente' | 'Contado' | 'Vazio' | 'Pulado';
    justification?: string;
}


// User Management Types
export enum Permission {
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',
    MANAGE_RECEBIMENTO = 'MANAGE_RECEBIMENTO',
    MANAGE_APONTAMENTO = 'MANAGE_APONTAMENTO',
    MANAGE_ARMAZENAGEM = 'MANAGE_ARMAZENAGEM',
    MANAGE_PEDIDOS = 'MANAGE_PEDIDOS',
    MANAGE_PICKING = 'MANAGE_PICKING',
    MANAGE_CONFERENCIA = 'MANAGE_CONFERENCIA',
    MANAGE_EXPEDICAO = 'MANAGE_EXPEDICAO',
    MANAGE_INVENTORY = 'MANAGE_INVENTORY',
    VIEW_MISSOES = 'VIEW_MISSOES',
    VIEW_RELATORIOS = 'VIEW_RELATORIOS',
    MANAGE_CADASTRO_SKU = 'MANAGE_CADASTRO_SKU',
    MANAGE_CADASTRO_ENDERECO = 'MANAGE_CADASTRO_ENDERECO',
    MANAGE_CADASTRO_INDUSTRIA = 'MANAGE_CADASTRO_INDUSTRIA',
    MANAGE_CADASTRO_USUARIOS = 'MANAGE_CADASTRO_USUARIOS',
    MANAGE_CADASTRO_PERFIS = 'MANAGE_CADASTRO_PERFIS'
}

export const permissionLabels: Record<Permission, string> = {
    [Permission.VIEW_DASHBOARD]: 'Ver Dashboard',
    [Permission.MANAGE_RECEBIMENTO]: 'Gerenciar Recebimento',
    [Permission.MANAGE_APONTAMENTO]: 'Realizar Apontamento',
    [Permission.MANAGE_ARMAZENAGEM]: 'Realizar Armazenagem',
    [Permission.MANAGE_PEDIDOS]: 'Gerenciar Pedidos',
    [Permission.MANAGE_PICKING]: 'Realizar Picking',
    [Permission.MANAGE_CONFERENCIA]: 'Realizar Conferência',
    [Permission.MANAGE_EXPEDICAO]: 'Realizar Expedição',
    [Permission.MANAGE_INVENTORY]: 'Gerenciar Inventário',
    [Permission.VIEW_MISSOES]: 'Ver Missões',
    [Permission.VIEW_RELATORIOS]: 'Ver Relatórios',
    [Permission.MANAGE_CADASTRO_SKU]: 'Gerenciar SKUs',
    [Permission.MANAGE_CADASTRO_ENDERECO]: 'Gerenciar Endereços',
    [Permission.MANAGE_CADASTRO_INDUSTRIA]: 'Gerenciar Indústrias',
    [Permission.MANAGE_CADASTRO_USUARIOS]: 'Gerenciar Usuários',
    [Permission.MANAGE_CADASTRO_PERFIS]: 'Gerenciar Perfis de Acesso',
};

export interface Profile {
    id: string;
    name: string;
    permissions: Partial<Record<Permission, boolean>>;
}

export enum UserStatus {
    ATIVO = 'Ativo',
    INATIVO = 'Inativo'
}

export interface User {
    id: string;
    username: string;
    fullName: string;
    profileId: string;
    status: UserStatus;
}