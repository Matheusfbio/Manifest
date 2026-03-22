# Manifest — Documentação do Projeto

Aplicativo React Native (Expo) para controle de entrada e saída de produtos com manifesto, geração de relatórios e autenticação por biometria ou senha.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| [Expo](https://expo.dev) + [expo-router](https://expo.github.io/router) | Framework e navegação baseada em arquivos |
| [React Native Paper](https://callstack.github.io/react-native-paper) | Componentes de UI (Material Design) |
| [Zustand](https://zustand-demo.pmnd.rs) | Gerenciamento de estado global |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Formulários com validação de schema |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage) | Persistência local dos dados |
| [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication) | Autenticação biométrica (mobile) |
| [expo-print](https://docs.expo.dev/versions/latest/sdk/print) + [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing) | Geração e compartilhamento de PDF |
| [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem) | Geração de arquivos CSV |
| NativeWind + Tailwind CSS | Estilização utilitária |

---

## Estrutura de Pastas

```
app/
├── (tabs)/
│   ├── _layout.tsx       # Tab bar com 3 abas
│   ├── index.tsx         # Aba: Manifesto (formulário)
│   ├── products.tsx      # Aba: Produtos (lista + filtros)
│   └── settings.tsx      # Aba: Configurações (perfil + auth)
├── _layout.tsx           # Layout raiz (Stack)
├── index.tsx             # Redireciona para /(tabs)
└── +not-found.tsx        # Tela 404

src/
├── components/
│   └── AuthGuard.tsx     # Guarda de autenticação (biometria/senha)
├── store/
│   ├── manifest.ts       # Store Zustand dos produtos
│   └── auth.ts           # Store Zustand de autenticação
├── services/
│   └── db.ts             # Serviço de banco de dados (SQLite, reservado)
└── view/
    └── ManifestFormScreen.tsx  # Tela legada (referência)
```

---

## Funcionalidades

### 📋 Aba — Manifesto (Formulário)

Formulário para registrar a entrada ou saída de um produto no manifesto.

**Campos:**
- Nome do produto
- Lote
- Unidade
- Responsável
- Data de hoje
- Validade (`YYYY-MM-DD`)
- Tipo: Entrada / Saída
- Observações (opcional)

Ao submeter, o produto é salvo no store global (Zustand) e persistido via AsyncStorage.

---

### 📦 Aba — Produtos

Lista todos os produtos cadastrados com filtros e ações de exportação.

**Filtros disponíveis (via Chips):**

| Filtro | Ordenação |
|---|---|
| Últimos adicionados | Por `createdAt` decrescente |
| Data de vencimento | Por `validade` crescente |
| Dias restantes | Por dias para vencer crescente |

**Indicador de urgência por cor:**

| Cor | Critério |
|---|---|
| 🔘 Cinza | Mais de 35 dias para vencer |
| 🟢 Verde | 26 a 35 dias para vencer |
| 🟡 Amarelo | 16 a 25 dias para vencer |
| 🔴 Vermelho | 15 dias ou menos / vencido |

**Ações:**
- Remover produto individualmente
- Exportar lista como **PDF** (via `expo-print`)
- Exportar lista como **CSV** (via `expo-file-system`)
- Limpar todos os produtos

---

### ⚙️ Aba — Configurações

Gerenciamento do perfil do usuário e método de autenticação.

**Opções:**
- Definir nome de exibição
- Criar ou alterar senha (mínimo 4 caracteres)
- Ativar/desativar autenticação biométrica (apenas mobile, se o hardware suportar)
- Botão para sair / bloquear o app

---

### 🔐 Autenticação (AuthGuard)

O componente `AuthGuard` envolve toda a navegação por tabs e controla o acesso ao app.

**Comportamento por plataforma:**

| Plataforma | Comportamento |
|---|---|
| Mobile (iOS/Android) | Tenta biometria automaticamente se habilitada. Fallback para senha |
| Web | Exibe campo de senha diretamente |
| Sem configuração | Permite entrada sem senha e orienta o usuário a configurar |

A senha é armazenada como hash simples via `AsyncStorage`. A biometria usa `expo-local-authentication`.

---

## Como rodar

```bash
# Instalar dependências
yarn install

# Iniciar em modo desenvolvimento
yarn start

# Android
yarn android

# iOS
yarn ios

# Web
yarn web
```

---

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `yarn start` | Inicia o servidor Expo com cache limpo |
| `yarn android` | Roda no Android |
| `yarn ios` | Roda no iOS |
| `yarn web` | Roda no navegador |
| `yarn lint` | Verifica lint e formatação |
| `yarn format` | Corrige lint e formata o código |
| `yarn prebuild` | Gera código nativo (Android/iOS) |

---

## Build (EAS)

O projeto está configurado com [EAS Build](https://docs.expo.dev/build/introduction/) via `eas.json`.

| Perfil | Descrição |
|---|---|
| `development` | Build de desenvolvimento com DevClient |
| `preview` | Build interno para testes |
| `production` | Build de produção com auto-increment de versão |

```bash
# Build de preview
eas build --profile preview --platform android

# Build de produção
eas build --profile production --platform all
```
