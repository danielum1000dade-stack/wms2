
export enum SKUStatus {
  ATIVO = 'Ativo',
  BLOQUEADO = 'Bloqueado',
  DESCONTINUADO = 'Descontinuado'
}

export enum CategoriaProduto {
  GERAL = 'Geral',
  REFRIGERADO = 'Refrigerado',
  CONGELADO = 'Congelado',
  INFLAMAVEL = 'Inflamável',
  QUIMICO = 'Químico',
  FRAGIL = 'Frágil'
}

// Novo: Setorização para validação cruzada Endereço x SKU
export enum SetorArmazem {
  SECO = 'Seco',
  RESFRIADO = 'Resfriado',
  CONGELADO = 'Congelado',
  INFLAMAVEL = 'Inflamável',
  QUARENTENA = 'Quarentena'
}

export interface Dimensoes {
  altura: number; // cm
  largura: number; // cm
  comprimento: number; // cm
  pesoBruto: number; // kg
  volumeM3: number;
}

export interface SKU {
  id: string;
  sku: string;
  descritivo: string;
  unidadeMedida: string; // UN, CX, KG, L
  dimensoes: Dimensoes;
  totalCaixas: number; // Lastro x Camada
  tempoVida: number; // dias (Shelf Life total)
  shelfLifeMinimoRecebimento: number; // dias
  peso: number; // kg total do pallet
  qtdPorCamada: number;
  camadaPorLastro: number;
  sre1: string;
  sre2: string;
  sre3: string;
  sre4: string;
  sre5: string;
  classificacao: string;
  familia: string;
  categoria: CategoriaProduto;
  setor: SetorArmazem; // Amarração de setor
  industriaId?: string;
  status: SKUStatus;
  motivoBloqueio?: string;
  classificacaoABC?: 'A' | 'B' | 'C';
  foto?: string;
  temperaturaMin?: number;
  temperaturaMax?: number;
}

export interface IndustriaRegras {
    exigir_lote: boolean;
    exigir_validade: boolean;
    permitir_estoque_negativo: boolean;
    validacao_shelf_life: boolean;
    agrupar_pedidos: boolean;
}

export interface Industria {
  id: string;
  nome: string;
  cnpj?: string;
  regras: IndustriaRegras; // JSON de regras
}

export enum EnderecoTipo {
  ARMAZENAGEM = 'Armazenagem', // Pulmão
  PICKING = 'Picking', // Apanha
  EXPEDICAO = 'Expedição', // Stage Out
  RECEBIMENTO = 'Recebimento', // Stage In
  ANTECAMARA = 'Antecâmara',
  DOCA = 'Doca',
  BLOCADO = 'Blocado'
}

export enum EnderecoStatus {
  LIVRE = 'Livre',
  OCUPADO = 'Ocupado',
  PARCIAL = 'Parcial', // Ocupado mas cabe mais
  BLOQUEADO = 'Bloqueado',
  INVENTARIO = 'Em Inventário'
}

export interface Endereco {
  id: string;
  codigo: string; // Rua-Predio-Nivel-Posicao
  nome: string;
  altura: number; 
  capacidade: number; // pallets
  pesoMaximo: number; // kg
  tipo: EnderecoTipo;
  status: EnderecoStatus;
  setor: SetorArmazem; // Amarração de setor
  sre1?: string;
  sre2?: string;
  sre3?: string;
  sre4?: string;
  sre5?: string;
  categoriasPermitidas: CategoriaProduto[]; // Trava de segurança
  motivoBloqueio?: string;
  industriaId?: string;
  zona?: string;
  sequenciaPicking?: number;
}

export interface Recebimento {
    id: string;
    placaVeiculo: string;
    fornecedor: string;
    notaFiscal: string;
    temperaturaVeiculo: number;
    dataHoraChegada: string;
    etiquetasGeradas: number;
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
    status: 'Aguardando' | 'Em Conferência' | 'Finalizado';
}

export enum EtiquetaStatus {
    PENDENTE_APONTAMENTO = 'Pendente Apontamento',
    APONTADA = 'Apontada', // Gerada mas na doca
    ARMAZENADA = 'Armazenada', // No pulmão
    EM_SEPARACAO = 'Em Separação', // Reservada para pedido
    PICKING = 'No Picking', // Pallet aberto no picking
    CONFERIDA = 'Conferida',
    EXPEDIDA = 'Expedida',
    BAIXADA = 'Baixada' // Consumida ou Perda
}

export interface Etiqueta {
    id: string;
    recebimentoId: string;
    status: EtiquetaStatus;
    skuId?: string;
    quantidadeCaixas?: number;
    quantidadeOriginal?: number;
    lote?: string;
    validade?: string;
    observacoes?: string;
    enderecoId?: string;
    dataApontamento?: string;
    dataArmazenagem?: string;
    dataExpedicao?: string;
    palletConsolidadoId?: string; 
    isBlocked?: boolean;
    motivoBloqueio?: string;
}

export interface PedidoItem {
    sku: string;
    descricao: string;
    lote: string;
    quantidadeCaixas: number;
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
    status: 'Pendente' | 'Em Separação' | 'Separado' | 'Em Conferência' | 'Conferência Parcial' | 'Aguardando Ressuprimento' | 'Conferido' | 'Expedido';
    createdAt: string;
    priority: boolean;
    cliente?: string;
    docaSaida?: string;
    ondaId?: string;
    origemImportacao?: string; // ID do ImportLog
}

export enum MissaoTipo {
    PICKING = 'Picking',
    REABASTECIMENTO = 'Reabastecimento',
    MOVIMENTACAO = 'Movimentação',
    MOVIMENTACAO_PALLET = 'Movimentação de Pallet',
    TRANSFERENCIA = 'Transferência',
    CONFERENCIA_CEGA = 'Conferência Cega',
    INVENTARIO = 'Inventário'
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
    startedAt?: string;
    finishedAt?: string;
    prioridadeScore?: number; 
}

export interface PalletConsolidado {
  id: string;
  pedidoId: string;
  etiquetas: string[];
  quantidadeCaixasTotal: number;
  skusContidos: string[];
}

export enum DivergenciaTipo {
    AVARIA = 'Avaria',
    FALTA = 'Falta',
    SOBRA = 'Sobra',
    ESTOQUE_INCORRETO = 'Estoque Incorreto',
    VALIDADE_DIVERGENTE = 'Validade Divergente'
}

export enum DivergenciaFonte {
    RECEBIMENTO = 'Recebimento',
    PICKING = 'Picking',
    CONFERENCIA = 'Conferência',
    INVENTARIO = 'Inventário',
}

export interface Divergencia {
    id: string;
    fonte: DivergenciaFonte;
    tipo: DivergenciaTipo;
    skuId: string;
    quantidade: number;
    observacao?: string;
    recebimentoId?: string;
    missaoId?: string;
    pedidoId?: string;
    operadorId?: string;
    createdAt: string;
}

export enum ConferenciaErroTipo {
  FALTA = 'Falta',
  SOBRA = 'Sobra',
  AVARIA = 'Avaria',
  PRODUTO_DIVERGENTE = 'Produto Divergente',
  UNIDADE_INCORRETA = 'Unidade Incorreta'
}

export interface Conferencia {
  id: string;
  pedidoId: string;
  conferenteId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'Em Andamento' | 'Concluída';
}

export interface ConferenciaItem {
  id: string;
  conferenciaId: string;
  skuId: string;
  lote: string;
  quantidadeContada: number;
}

export interface ConferenciaErro {
  id: string;
  conferenciaId: string;
  pedidoId: string;
  skuId: string;
  lote?: string;
  tipo: ConferenciaErroTipo;
  quantidadeDivergente: number;
  observacao?: string;
  conferenteId: string;
  createdAt: string;
}

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
    countedBy?: string; 
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
    discrepancy: number; 
    countedAt: string;
    status: 'Pendente' | 'Contado' | 'Vazio' | 'Pulado';
    justification?: string;
}

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
    MANAGE_CADASTRO_PERFIS = 'MANAGE_CADASTRO_PERFIS',
    MANAGE_CADASTRO_BLOQUEIOS = 'MANAGE_CADASTRO_BLOQUEIOS',
    MANAGE_CONFIGURACOES = 'MANAGE_CONFIGURACOES',
    REPROCESSAR_MISSAO = 'REPROCESSAR_MISSAO',
    BAIXA_PALLET = 'BAIXA_PALLET'
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
    [Permission.MANAGE_CADASTRO_BLOQUEIOS]: 'Gerenciar Tipos de Bloqueio',
    [Permission.MANAGE_CONFIGURACOES]: 'Gerenciar Configurações',
    [Permission.REPROCESSAR_MISSAO]: 'Refazer Separação de Pedido',
    [Permission.BAIXA_PALLET]: 'Realizar Baixa Total de Pallet'
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

export enum BloqueioAplicaA {
  SKU = 'SKU',
  PALLET = 'Pallet',
  ENDERECO = 'Endereço'
}

export interface TipoBloqueio {
  id: string;
  codigo: string;
  descricao: string;
  aplicaA: BloqueioAplicaA[];
}

export enum AuditActionType {
    CREATE = 'Criação',
    UPDATE = 'Atualização',
    DELETE = 'Exclusão',
    MOVE = 'Movimentação',
    STATUS_CHANGE = 'Mudança de Status',
    LOGIN = 'Login',
    ERROR = 'Erro',
    ADJUSTMENT = 'Ajuste de Estoque',
    REPLENISHMENT_TRIGGER = 'Gatilho Ressuprimento',
    PICKING_SHORTAGE = 'Ruptura Picking',
    IMPORT = 'Importação'
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    actionType: AuditActionType;
    entity: 'SKU' | 'Pedido' | 'Etiqueta' | 'Endereço' | 'Missão' | 'Recebimento' | 'Conferência' | 'Divergência' | 'Estoque' | 'Importação' | 'User';
    entityId: string;
    details: string;
    metadata?: any;
}

export interface StorageRule {
    id: string;
    name: string;
    condition: (sku: SKU, endereco: Endereco) => boolean;
    priority: number; 
    action: 'ALLOW' | 'DENY' | 'PREFER';
}

// --- IMPORTAÇÃO DINÂMICA ---

export enum ImportTransformation {
    NONE = 'Nenhuma',
    UPPERCASE = 'Maiúsculas',
    LOWERCASE = 'Minúsculas',
    TRIM = 'Remover Espaços (Trim)',
    NUMBER_INT = 'Número Inteiro',
    NUMBER_FLOAT = 'Número Decimal',
    DATE_ISO = 'Data ISO (YYYY-MM-DD)',
    DATE_BR = 'Data BR (DD/MM/AAAA)',
    REMOVE_SPECIAL = 'Remover Caracteres Especiais'
}

export enum WMSFieldEnum {
    // Pedidos
    PEDIDO_NUMERO = 'pedido_numero',
    PEDIDO_CLIENTE = 'pedido_cliente',
    SKU_CODIGO = 'sku_codigo',
    QUANTIDADE = 'quantidade',
    LOTE = 'lote',
    VALIDADE = 'validade',
    UNIDADE = 'unidade', // CX, UN
    
    // Recebimento
    NF_NUMERO = 'nf_numero',
    FORNECEDOR = 'fornecedor',
    PLACA = 'placa'
}

export const WMSFieldLabels: Record<WMSFieldEnum, string> = {
    [WMSFieldEnum.PEDIDO_NUMERO]: 'Número do Pedido/Transporte',
    [WMSFieldEnum.PEDIDO_CLIENTE]: 'Cliente',
    [WMSFieldEnum.SKU_CODIGO]: 'Código SKU',
    [WMSFieldEnum.QUANTIDADE]: 'Quantidade',
    [WMSFieldEnum.LOTE]: 'Lote',
    [WMSFieldEnum.VALIDADE]: 'Data de Validade',
    [WMSFieldEnum.UNIDADE]: 'Unidade de Medida',
    [WMSFieldEnum.NF_NUMERO]: 'Número da Nota Fiscal',
    [WMSFieldEnum.FORNECEDOR]: 'Fornecedor',
    [WMSFieldEnum.PLACA]: 'Placa Veículo'
};

export interface ImportMapping {
    fileColumn: string; // Nome da coluna no Excel/CSV
    wmsField: WMSFieldEnum; // Campo destino no WMS
    required: boolean;
    transformation: ImportTransformation;
    defaultValue?: string; // Valor fixo caso venha vazio
}

export interface ImportTemplate {
    id: string;
    industriaId: string;
    name: string;
    type: 'PEDIDO' | 'RECEBIMENTO'; // O que este arquivo importa?
    mappings: ImportMapping[];
    active: boolean;
}

export interface ImportLog {
    id: string;
    timestamp: string;
    templateId: string;
    industriaId: string;
    fileName: string;
    status: 'SUCESSO' | 'FALHA' | 'PARCIAL';
    totalRecords: number;
    successCount: number;
    errorCount: number;
    errorsJson: string; // JSON com lista de erros detalhados
    userId: string;
}
