
# WMS Pro - Especificação de Arquitetura Corporativa

## 1. Visão Geral
O **WMS Pro** é uma plataforma de gestão logística de classe mundial, projetada para escalabilidade, resiliência e inteligência operacional. Esta especificação define a transição do protótipo React para uma arquitetura baseada em microsserviços orientada a eventos.

## 2. Stack Tecnológico (Backend & Infraestrutura)

*   **Linguagem:** Node.js (TypeScript)
*   **Framework:** NestJS (Modularidade e Injeção de Dependência)
*   **Banco de Dados Relacional:** PostgreSQL (Dados Core: Estoque, Pedidos)
*   **Banco de Dados NoSQL:** MongoDB (Logs de Auditoria, Payload de Eventos)
*   **Cache / Lock Distribuído:** Redis
*   **Mensageria (Event Bus):** RabbitMQ
*   **ORM:** Prisma
*   **API Gateway:** Kong ou NGINX

## 3. Módulos do Backend (Microsserviços)

### A. Core Service (Monolito Modular)
*   **Responsabilidade:** Cadastros, Gestão de Estoque (Inventory Ledger), Lógica de Negócio Síncrona.
*   **Endpoints Críticos:**
    *   `POST /inventory/move` (Transação atômica de estoque)
    *   `GET /stock/snapshot` (Posição atual)

### B. Inbound Service
*   **Responsabilidade:** Processamento de NF-e, Agendamento de Docas, Conferência de Entrada.
*   **Integração:** Webhooks para SEFAZ/ERP.

### C. Outbound Service
*   **Responsabilidade:** Gestão de Pedidos, Formação de Ondas (Wave Planning), Conferência de Saída.
*   **Algoritmos:** Wave Clustering (Agrupamento inteligente de pedidos).

### D. Task Engine (Motor de Missões)
*   **Responsabilidade:** O "Cérebro" da operação.
*   **Funcionalidade:**
    *   Escuta eventos de `OrderCreated` ou `PalletReceived`.
    *   Gera missões de Picking/Putaway baseadas em regras.
    *   Atribui missões a operadores baseados em localização e perfil.

### E. Intelligence Service (IA & Rules)
*   **Responsabilidade:** Otimização contínua.
*   **Funcionalidades:**
    *   **Putaway Scoring:** Calcula o melhor endereço para guardar um pallet (considerando SRE, Curva ABC, Calor).
    *   **Slotting Optimizer:** Job noturno que analisa o giro e sugere mudanças de layout.

## 4. Modelo de Dados (Esquema Simplificado)

```sql
-- Tabela Mestra de Estoque (Inventory Ledger)
CREATE TABLE inventory_ledger (
    id UUID PRIMARY KEY,
    lpn VARCHAR(50) NOT NULL, -- License Plate Number
    sku_id UUID NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    location_id UUID NOT NULL,
    status ENUM('AVAILABLE', 'BLOCKED', 'RESERVED') DEFAULT 'AVAILABLE',
    batch_no VARCHAR(50),
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Missões (Task Queue)
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    type ENUM('PICK', 'PUTAWAY', 'REPLENISH', 'COUNT'),
    status ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    priority INT DEFAULT 50, -- 1 (Low) to 100 (Critical)
    source_location_id UUID,
    target_location_id UUID,
    lpn VARCHAR(50),
    assigned_user_id UUID,
    wave_id UUID, -- Agrupamento
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Fluxos de IA e Automação

### 5.1. Putaway Inteligente (Lógica de Score)
Quando um pallet é recebido, o sistema consulta o `Intelligence Service`:
1.  Busca endereços livres.
2.  Filtra por **Regras Restritivas (Hard Rules)**: Zona Fria? Inflamável? Peso suportado?
3.  Ordena por **Score (Soft Rules)**:
    *   +100 pts: Mesmo SKU em posição adjacente.
    *   +50 pts: Zona ideal baseada na Curva ABC (A -> Próximo à doca).
    *   -10 pts: Por metro de distância da doca de entrada.

### 5.2. Ressuprimento Preditivo
O sistema monitora o Picking Face (Endereço de Apanha):
*   **Gatilho:** Picking Slot < 20% da capacidade OU Pedido Grande Pendente.
*   **Ação:** Gera missão de `REPLENISH` com prioridade máxima (99).
*   **Origem:** Busca pallet mais antigo (FEFO) no aéreo.

## 6. Padrão de UX Industrial (Mobile)

*   **Filosofia:** "Eyes-free scanning". O operador deve conseguir trabalhar guiado apenas pelo som e feedback tátil, olhando para a tela apenas em exceções.
*   **Wizard Pattern:** Nunca mostrar listas longas. Mostrar apenas o passo atual:
    1.  Vá para X.
    2.  Bipe X.
    3.  Pegue Y.
    4.  Confirme Qtd.
*   **Tratamento de Erro:** Tela cheia vermelha + Vibração longa. O operador não pode ignorar um erro.

## 7. Estratégia Offline (PWA)

1.  **Download de Missões:** Ao logar, o coletor baixa um JSON com suas missões atribuídas e tabelas auxiliares (SKUs, Endereços da zona).
2.  **Fila Local (IndexedDB):** As ações (Picking Confirmado) são salvas localmente.
3.  **Sync Manager:** Um Web Worker tenta enviar a fila para o servidor a cada 30 segundos.
4.  **Conflito:** Se o servidor rejeitar (ex: estoque já consumido), o app força uma atualização de dados e alerta o operador.

## 8. Roadmap de Implementação Backend

1.  **Fase 1:** Setup NestJS + Postgres. Migrar lógica de Auth e Cadastro.
2.  **Fase 2:** Migrar Estoque e Movimentações (Ledger).
3.  **Fase 3:** Implementar RabbitMQ para desacoplar a geração de missões.
4.  **Fase 4:** Microsserviço de IA para sugestão de endereços.
