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

export interface Endereco {
  id: string;
  codigo: string;
  nome: string;
  altura: number; // metros
  capacidade: number; // pallets
  tipo: EnderecoTipo;
  ocupado: boolean;
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
}

export interface PedidoItem {
    sku: string;
    descricao: string;
    data: string;
    lote: string;
    quantidadeCaixas: number;
}

export interface Pedido {
    id: string;
    numeroTransporte: string;
    descritivoEntrega: string;
    items: PedidoItem[];
    status: 'Pendente' | 'Em Separação' | 'Separado' | 'Conferido' | 'Expedido';
}

export enum MissaoTipo {
    PICKING = 'Picking',
    REABASTECIMENTO = 'Reabastecimento',
    MOVIMENTACAO = 'Movimentação',
    TRANSFERENCIA = 'Transferência',
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
    status: 'Pendente' | 'Em Andamento' | 'Concluída';
    operador?: string;
}

export interface PalletConsolidado {
  id: string;
  pedidoId: string;
  etiquetas: string[]; // array de IDs de etiquetas de produto
  quantidadeCaixasTotal: number;
  skusContidos: string[]; // array de IDs de SKU
}