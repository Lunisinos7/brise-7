# Inventário do Projeto

Documento para guiar a refatoração. Lista todos os componentes, hooks e dependências com status de uso.

**Última atualização**: Refatoração de 10/01/2026

---

## Componentes UI (src/components/ui/)

### ✅ Em Uso (35 componentes)

| Componente | Usado em |
|------------|----------|
| `accordion.tsx` | Settings, Automations |
| `alert-dialog.tsx` | Confirmações de deleção |
| `alert.tsx` | Mensagens de alerta |
| `avatar.tsx` | Workspace, Users |
| `badge.tsx` | Status, integrações |
| `button.tsx` | Em toda aplicação |
| `calendar.tsx` | Seleção de datas |
| `card.tsx` | Cards do dashboard |
| `checkbox.tsx` | Formulários |
| `collapsible.tsx` | Seções expansíveis |
| `command.tsx` | Search/command features |
| `dialog.tsx` | Modais |
| `dropdown-menu.tsx` | Menus de ação |
| `form.tsx` | Formulários com react-hook-form |
| `input.tsx` | Campos de entrada |
| `label.tsx` | Labels de formulário |
| `popover.tsx` | Popovers |
| `progress.tsx` | Barras de progresso |
| `radio-group.tsx` | Seleção única |
| `range-slider.tsx` | Controle de setpoints |
| `scroll-area.tsx` | Áreas com scroll |
| `select.tsx` | Dropdowns |
| `separator.tsx` | Divisores |
| `sheet.tsx` | Painéis laterais |
| `skeleton.tsx` | Loading states |
| `slider.tsx` | Controle de temperatura |
| `sonner.tsx` | Toasts alternativos |
| `switch.tsx` | Toggles on/off |
| `table.tsx` | Tabelas de dados |
| `tabs.tsx` | Navegação por abas |
| `textarea.tsx` | Campos de texto longo |
| `toast.tsx` | Notificações |
| `toaster.tsx` | Container de toasts |
| `tooltip.tsx` | Dicas de contexto |

### ❌ Removidos (16 componentes)

| Componente | Data | Motivo |
|------------|------|--------|
| `aspect-ratio.tsx` | 10/01/2026 | Sem uso |
| `breadcrumb.tsx` | 10/01/2026 | Navegação não usa |
| `carousel.tsx` | 10/01/2026 | Sem carrosséis |
| `chart.tsx` | 10/01/2026 | Usa recharts diretamente |
| `context-menu.tsx` | 10/01/2026 | Sem menus de contexto |
| `drawer.tsx` | 10/01/2026 | Usa sheet |
| `hover-card.tsx` | 10/01/2026 | Sem uso |
| `input-otp.tsx` | 10/01/2026 | Sem OTP |
| `menubar.tsx` | 10/01/2026 | Usa dropdown |
| `navigation-menu.tsx` | 10/01/2026 | Sem uso |
| `pagination.tsx` | 10/01/2026 | Tabelas não paginam |
| `resizable.tsx` | 10/01/2026 | Sem painéis redimensionáveis |
| `sidebar.tsx` | 10/01/2026 | Usa sheet |
| `toggle.tsx` | 10/01/2026 | Usa switch |
| `toggle-group.tsx` | 10/01/2026 | Sem uso |
| `use-toast.ts` | 10/01/2026 | Duplicado (movido para hooks/) |

---

## Hooks (src/hooks/)

### Por Domínio

**BRISE (src/hooks/brise/) - ✅ Consolidado**
```
src/hooks/brise/
├── index.ts              # Re-exports
├── useBriseConfig.ts     # Configuração
├── useBriseControl.ts    # Comandos
├── useBriseDevices.ts    # Lista dispositivos
└── useBriseSync.ts       # Sincronização
```
**Import**: `import { useBriseConfig, useBriseControl } from "@/hooks/brise"`

**SmartThings (src/hooks/smartthings/) - ✅ Consolidado**
```
src/hooks/smartthings/
├── index.ts                  # Re-exports
├── useSmartThingsConfig.ts   # Configuração
├── useSmartThingsControl.ts  # Comandos
└── useSmartThingsDevices.ts  # Lista dispositivos
```
**Import**: `import { useSmartThingsConfig } from "@/hooks/smartthings"`

**Core (5 arquivos)**
- `useAuth.ts` - Autenticação
- `useWorkspaces.ts` - Workspaces
- `useUsers.ts` - Usuários
- `useEquipments.ts` - Equipamentos
- `useWorkspaceSettings.ts` - Configurações

**Automações (2 arquivos)**
- `useTimeRoutines.ts` - Rotinas por horário
- `useOccupancyAutomations.ts` - Por ocupação

**Monitoramento (4 arquivos)**
- `useAlerts.ts` - Alertas
- `useAlertSettings.ts` - Config de alertas
- `useReportData.ts` - Dados para relatórios
- `useAccumulatedExpense.ts` - Gasto acumulado

**Utilitários (2 arquivos)**
- `use-mobile.tsx` - Detecção mobile
- `use-toast.ts` - Sistema de toasts

---

## Edge Functions (supabase/functions/)

| Função | Propósito | Dependências |
|--------|-----------|--------------|
| `brise-auth` | OAuth BRISE | BRISE_CLIENT_ID, BRISE_CLIENT_SECRET |
| `brise-control` | Comandos BRISE | - |
| `brise-devices` | Lista dispositivos | - |
| `brise-status` | Sincroniza estado | - |
| `smartthings-auth` | Valida token | - |
| `smartthings-control` | Comandos ST | - |
| `smartthings-devices` | Lista dispositivos | - |
| `smartthings-sync` | Sincroniza estado | - |
| `collect-energy-data` | Coleta periódica | Cron: */30 * * * * |
| `send-email` | Envio de e-mails | RESEND_API_KEY (opcional) |

---

## Internacionalização (src/locales/)

| Idioma | Arquivo | Status |
|--------|---------|--------|
| Português (BR) | `pt-BR.json` | ✅ Principal |
| English (US) | `en-US.json` | ✅ Manter |
| Español | `es-ES.json` | ⚠️ Avaliar remoção |
| Deutsch | `de-DE.json` | ⚠️ Avaliar remoção |

---

## Dependências NPM

### ✅ Essenciais

| Pacote | Uso |
|--------|-----|
| `react`, `react-dom` | Framework |
| `react-router-dom` | Roteamento |
| `@tanstack/react-query` | Estado servidor |
| `@supabase/supabase-js` | Backend |
| `tailwindcss`, `tailwind-merge` | Estilização |
| `class-variance-authority` | Variantes CSS |
| `lucide-react` | Ícones |
| `react-hook-form`, `@hookform/resolvers`, `zod` | Formulários |
| `date-fns` | Manipulação de datas |
| `recharts` | Gráficos |
| `i18next`, `react-i18next` | Internacionalização |
| `sonner` | Toasts |
| `cmdk` | Command components |

### ❌ Dependências Removidas (10/01/2026)

| Pacote | Motivo |
|--------|--------|
| `embla-carousel-react` | Carousel removido |
| `react-resizable-panels` | Resizable removido |
| `input-otp` | OTP removido |
| `vaul` | Drawer removido |
| `@radix-ui/react-aspect-ratio` | Componente removido |
| `@radix-ui/react-context-menu` | Componente removido |
| `@radix-ui/react-hover-card` | Componente removido |
| `@radix-ui/react-menubar` | Componente removido |
| `@radix-ui/react-navigation-menu` | Componente removido |
| `@radix-ui/react-toggle` | Componente removido |
| `@radix-ui/react-toggle-group` | Componente removido |

---

## Páginas (src/pages/)

| Página | Rota | Componentes Principais |
|--------|------|------------------------|
| `Auth.tsx` | `/auth` | Login/Signup forms |
| `Dashboard.tsx` | `/` | EnvironmentCard, StatusCard, AccumulatedExpenseCard |
| `Equipments.tsx` | `/equipments` | EquipmentCard, AddEquipmentDialog |
| `Automations.tsx` | `/automations` | TimeRoutineDialog, OccupancyAutomationDialog |
| `Reports.tsx` | `/reports` | Charts, PeriodSelector, ExportDialog |
| `Alarms.tsx` | `/alarms` | AlertSettings |
| `Users.tsx` | `/users` | EditUserDialog |
| `Settings.tsx` | `/settings` | BriseConfig, SmartThingsConfig, EnergyRateConfig |
| `Index.tsx` | - | Redirect para Dashboard |
| `NotFound.tsx` | `*` | 404 |

---

## Métricas da Refatoração

| Métrica | Antes | Depois | Redução |
|---------|-------|--------|---------|
| Componentes UI | 51 | 35 | -16 |
| Hooks na raiz | 20 | 13 | -7 |
| Dependências NPM | ~50 | ~39 | -11 |
| Arquivos duplicados | 1 | 0 | -1 |

---

## Complexidade por Arquivo

### 🔴 Alta (Refatorar próxima fase)

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `Dashboard.tsx` | ~270 | Muitos handlers, mistura lógica |
| `useEquipments.ts` | ~200 | Muitas responsabilidades |
| `EnvironmentControlDialog.tsx` | ~600 | Muito extenso |

### 🟡 Média (Avaliar)

| Arquivo | Linhas | Observação |
|---------|--------|------------|
| `Automations.tsx` | ~150 | Pode extrair componentes |
| `Reports.tsx` | ~120 | OK, mas pode simplificar |

### 🟢 Baixa (OK)

Maioria dos componentes UI e hooks simples.
