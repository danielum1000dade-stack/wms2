# WMS Pro 2025 - Guia de Instalação

Este projeto é uma aplicação Web Moderna (Single Page Application) construída com **React, TypeScript e Vite**. 

Atualmente, o sistema opera em modo **"Serverless Local"**, utilizando o armazenamento do navegador (LocalStorage) para simular o banco de dados. Isso significa que você não precisa instalar MySQL ou PostgreSQL para testar.

## Pré-requisitos

Você precisa ter instalado no seu computador:
1.  **Node.js** (Versão 18 ou superior) - [Baixar aqui](https://nodejs.org/)

## Passo a Passo para Instalar

### 1. Estrutura de Pastas
Certifique-se de que todos os arquivos de código (`.tsx`, `.ts`) fornecidos anteriormente estejam organizados na seguinte estrutura:

```
/wms-pro
  ├── index.html
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  ├── tailwind.config.js
  ├── postcss.config.js
  ├── src/ (opcional, se você moveu os arquivos, caso contrário deixe na raiz)
  ├── components/
  │   └── ... (todos os componentes .tsx)
  ├── pages/
  │   └── ... (todas as páginas .tsx)
  ├── context/
  │   └── WMSContext.tsx
  ├── hooks/
  │   └── useLocalStorage.ts
  ├── App.tsx
  ├── index.tsx
  └── types.ts
```

### 2. Instalar Dependências
Abra o terminal (Prompt de Comando ou PowerShell) na pasta do projeto e execute:

```bash
npm install
```

Isso irá baixar todas as bibliotecas necessárias (React, Tailwind, bibliotecas de código de barras, etc.).

### 3. Executar o Projeto
Após a instalação, execute:

```bash
npm run dev
```

O terminal mostrará um link local, geralmente `http://localhost:3000`. Abra este link no seu navegador (Chrome ou Edge recomendados).

## Configuração do "Banco de Dados"

Como o sistema usa `localStorage`:

1.  **Primeiro Acesso:** Ao abrir o sistema pela primeira vez, ele detectará que não há dados e criará automaticamente:
    *   Usuário Admin Padrão.
    *   Perfis de Acesso Padrão.
2.  **Login:**
    *   **Usuário:** `admin`
    *   **Senha:** (Qualquer senha, ou deixe em branco no primeiro acesso, pois é um protótipo).
3.  **Popular Dados:**
    *   Vá até a aba **Cadastros** > **Importar Estoque**.
    *   Baixe a planilha modelo.
    *   Preencha com alguns dados fictícios e importe para ver o sistema em ação.

## Limpar o Banco de Dados (Reset)

Se quiser apagar tudo e começar do zero:
1.  No navegador, abra o sistema.
2.  Aperte `F12` para abrir as Ferramentas de Desenvolvedor.
3.  Vá na aba **Application** (Aplicação) > **Local Storage**.
4.  Clique com o botão direito no domínio (localhost) e selecione **Clear**.
5.  Recarregue a página (`F5`). O sistema recriará o usuário Admin padrão.

## Próximos Passos (Arquitetura Real)

Para levar este sistema para produção em um armazém real, a arquitetura deve evoluir para usar um Backend API. O arquivo `PLAN_DE_EVOLUCAO.md` (já incluso no projeto) detalha como migrar este protótipo para uma arquitetura com **Node.js (NestJS) + PostgreSQL**.
