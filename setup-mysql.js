
/**
 * WMS Pro - Setup Backend MySQL
 * Este script cria a pasta 'server', configura o Prisma ORM e o servidor Express.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.join(__dirname, 'server');
const srcDir = path.join(serverDir, 'src');
const prismaDir = path.join(serverDir, 'prisma');

// 1. Criar Estrutura de Pastas
if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir);
if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir);
if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir);

// 2. Arquivos do Backend

const packageJson = {
  "name": "wms-pro-backend",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push"
  },
  "dependencies": {
    "@prisma/client": "^5.12.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.7",
    "prisma": "^5.12.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
};

const tsConfig = {
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
};

// Schema do Prisma (Mapeia seus types.ts para tabelas MySQL)
const prismaSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Sku {
  id String @id @default(uuid())
  sku String @unique
  descritivo String
  unidadeMedida String
  dimensoes Json
  totalCaixas Int
  tempoVida Int
  shelfLifeMinimoRecebimento Int
  peso Float
  qtdPorCamada Int
  camadaPorLastro Int
  sre1 String?
  sre2 String?
  sre3 String?
  sre4 String?
  sre5 String?
  classificacao String
  familia String
  categoria String
  setor String
  industriaId String?
  status String
  motivoBloqueio String?
  classificacaoABC String?
  temperaturaMin Float?
  temperaturaMax Float?
  
  etiquetas Etiqueta[]
}

model Endereco {
  id String @id @default(uuid())
  codigo String @unique
  nome String
  altura Float
  capacidade Int
  pesoMaximo Float
  tipo String
  status String
  setor String?
  sre1 String?
  sre2 String?
  sre3 String?
  sre4 String?
  sre5 String?
  categoriasPermitidas Json? // Array de strings
  motivoBloqueio String?
  industriaId String?
  
  etiquetas Etiqueta[]
}

model Industria {
  id String @id @default(uuid())
  nome String
  cnpj String?
  regras Json
}

model Recebimento {
  id String @id @default(uuid())
  placaVeiculo String
  fornecedor String
  notaFiscal String
  temperaturaVeiculo Float
  dataHoraChegada DateTime
  etiquetasGeradas Int
  transportador String?
  lacre String?
  doca String?
  dataPrevista String?
  horaPrevista String?
  horaInicioDescarga String?
  horaFimDescarga String?
  temperaturaTermoKing Float?
  temperaturaInicio Float?
  temperaturaMeio Float?
  temperaturaFim Float?
  responsavel String?
  motorista String?
  status String
  houveAvarias Boolean @default(false)
  
  etiquetas Etiqueta[]
}

model Etiqueta {
  id String @id
  recebimentoId String
  recebimento Recebimento @relation(fields: [recebimentoId], references: [id])
  status String
  skuId String?
  sku Sku? @relation(fields: [skuId], references: [id])
  quantidadeCaixas Int?
  quantidadeOriginal Int?
  lote String?
  validade DateTime?
  observacoes String?
  enderecoId String?
  endereco Endereco? @relation(fields: [enderecoId], references: [id])
  dataApontamento DateTime?
  dataArmazenagem DateTime?
  dataExpedicao DateTime?
  palletConsolidadoId String?
  isBlocked Boolean @default(false)
  motivoBloqueio String?
}

model Pedido {
  id String @id @default(uuid())
  numeroTransporte String
  status String
  createdAt DateTime @default(now())
  priority Boolean @default(false)
  cliente String?
  docaSaida String?
  ondaId String?
  items Json // Array de PedidoItem
  origemImportacao String?
}

model Missao {
  id String @id @default(uuid())
  tipo String
  pedidoId String?
  etiquetaId String
  skuId String
  quantidade Int
  origemId String
  destinoId String
  status String
  operadorId String?
  createdAt DateTime @default(now())
  startedAt DateTime?
  finishedAt DateTime?
  prioridadeScore Int?
}

model User {
  id String @id @default(uuid())
  username String @unique
  fullName String
  profileId String
  status String
}

model Profile {
  id String @id @default(uuid())
  name String
  permissions Json
}

model AuditLog {
  id String @id @default(uuid())
  timestamp DateTime @default(now())
  userId String
  userName String
  actionType String
  entity String
  entityId String
  details String
  metadata Json?
}

// Tabelas auxiliares simplificadas
model Configuracao {
  chave String @id
  valor Json
}
`;

// Servidor Express Genérico
const serverCode = `
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Middleware de Log
app.use((req, res, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  next();
});

// --- CRUD Genérico Factory ---
const createCrud = (modelName: string, path: string) => {
  const model = (prisma as any)[modelName];

  // GET ALL
  app.get(path, async (req, res) => {
    try {
      const items = await model.findMany();
      res.json(items);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // CREATE
  app.post(path, async (req, res) => {
    try {
      const item = await model.create({ data: req.body });
      res.json(item);
    } catch (e) { 
      console.error(e);
      res.status(500).json({ error: String(e) }); 
    }
  });

  // UPDATE
  app.put(\`\${path}/:id\`, async (req, res) => {
    try {
      const item = await model.update({
        where: { id: req.params.id },
        data: req.body
      });
      res.json(item);
    } catch (e) { 
      console.error(e);
      res.status(500).json({ error: String(e) }); 
    }
  });

  // DELETE
  app.delete(\`\${path}/:id\`, async (req, res) => {
    try {
      await model.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });
  
  // BATCH CREATE (Para imports)
  app.post(\`\${path}/batch\`, async (req, res) => {
    try {
      const count = await model.createMany({ data: req.body });
      res.json(count);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });
};

// Registrando rotas
createCrud('sku', '/api/skus');
createCrud('endereco', '/api/enderecos');
createCrud('industria', '/api/industrias');
createCrud('recebimento', '/api/recebimentos');
createCrud('etiqueta', '/api/etiquetas');
createCrud('pedido', '/api/pedidos');
createCrud('missao', '/api/missoes');
createCrud('user', '/api/users');
createCrud('profile', '/api/profiles');
createCrud('auditLog', '/api/audit-logs');

// Rota especial para reset (dev only)
app.post('/api/reset', async (req, res) => {
    // Cuidado em produção!
    res.json({ message: "Feature de reset via API desabilitada por segurança" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`🚀 Servidor WMS Backend rodando na porta \${PORT}\`);
});
`;

// .env file
const envFile = `DATABASE_URL="mysql://root:senha@localhost:3306/wms_pro"`;

// Escrever arquivos
console.log("Criando arquivos do Backend...");
fs.writeFileSync(path.join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2));
fs.writeFileSync(path.join(serverDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
fs.writeFileSync(path.join(serverDir, '.env'), envFile);
fs.writeFileSync(path.join(srcDir, 'index.ts'), serverCode);
fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), prismaSchema);

console.log("\n✅ Estrutura Backend criada em /server");
console.log("IMPORTANTE: Configure a senha do seu MySQL no arquivo /server/.env");
console.log("DEPOIS: Rode 'npm run server:install' e 'npm run server:db:push' para inicializar o banco.");
