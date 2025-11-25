
# WMS Pro - Sistema de Gestão de Armazém

Este é um sistema completo de WMS rodando no navegador (Client-Side), utilizando React e LocalStorage como banco de dados.

## 🚀 Instalação Rápida

Siga estes passos para configurar o ambiente:

1.  **Instalar Dependências**
    Abra o terminal na pasta do projeto e execute:
    ```bash
    npm install
    ```

2.  **Configurar Estrutura**
    Execute o script de instalação que organiza as pastas e cria as configurações necessárias:
    ```bash
    node install.js
    ```

3.  **Rodar o Sistema**
    Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    O sistema abrirá em `http://localhost:3000`.

## 📦 Banco de Dados (Importante)

O sistema **não requer instalação de SQL**. O "Banco de Dados" é criado automaticamente no LocalStorage do seu navegador na primeira execução.

*   **Usuário Padrão:** `admin`
*   **Senha:** (Deixe em branco ou qualquer valor na primeira vez)

## 🛠 Solução de Problemas Comuns

*   **Erro de Câmera:** Se o scanner não abrir, verifique se o navegador tem permissão para acessar a câmera e se o site está rodando em `localhost` ou `https`.
*   **Impressão:** Se a etiqueta não aparecer, verifique se os pop-ups estão habilitados.
*   **Tela Branca:** Verifique o console (F12) para erros. Geralmente execute `node install.js` novamente para garantir que todos os arquivos de config estão certos.
