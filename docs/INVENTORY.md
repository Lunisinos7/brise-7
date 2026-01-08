# Inventário do Projeto

Documento para guiar a refatoração. Lista todos os componentes, hooks e dependências com status de uso.

---

## Componentes UI (src/components/ui/)

### ✅ Em Uso (Confirmado)

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
| `dialog.tsx` | Modais |
| `drawer.tsx` | Mobile navigation |
| `dropdown-menu.tsx` | Menus de ação |
| `form.tsx` | Formulários com react-hook-form |
| `input.tsx` | Campos de entrada |
| `label.tsx` | Labels de formulário |
| `popover.tsx` | Popovers |
| `progress.tsx` | Barras de progresso |
| `radio-group.tsx` | Seleção única |
| `scroll-area.tsx` | Áreas com scroll |
| `select.tsx` | Dropdowns |
| `separator.tsx` | Divisores |
| `sheet.tsx` | Painéis laterais |
| `skeleton.tsx` | Loading states |
| `slider.tsx` | Controle de temperatura |
| `switch.tsx` | Toggles on/off |
| `table.tsx` | Tabelas de dados |
| `tabs.tsx` | Navegação por abas |
| `textarea.tsx` | Campos de texto longo |
| `toast.tsx` | Notificações |
| `toaster.tsx` | Container de toasts |
| `tooltip.tsx` | Dicas de contexto |

### ⚠️ Candidatos a Remoção (Verificar)

| Componente | Motivo |
|------------|--------|
| `aspect-ratio.tsx` | Não encontrado uso |
| `breadcrumb.tsx` | Navegação não usa |
| `carousel.tsx` | Não há carrosséis |
| `command.tsx` | Não há command palette |
| `context-menu.tsx` | Não há menus de contexto |
| `hover-card.tsx` | Não encontrado uso |
| `input-otp.tsx` | Não há autenticação OTP |
| `menubar.tsx` | Navegação usa drawer |
| `navigation-menu.tsx` | Não usado |
| `pagination.tsx` | Tabelas não paginam |
| `range-slider.tsx` | Verificar se usado |
| `resizable.tsx` | Não há painéis redimensionáveis |
| `sidebar.tsx` | Usa drawer em vez disso |
| `sonner.tsx` | Duplica toaster |
| `toggle.tsx` | Usa switch em vez disso |
| `toggle-group.tsx` | Não encontrado uso |

---

## Hooks (src/hooks/)

### Por Domínio

**BRISE (4 arquivos → consolidar)**
- `useBriseConfig.ts` - Configuração
- `useBriseControl.ts` - Comandos
- `useBriseDevices.ts` - Lista dispositivos
- `useBriseSync.ts` - Sincronização

**SmartThings (3 arquivos → consolidar)**
- `useSmartThingsConfig.ts` - Configuração
- `useSmartThingsControl.ts` - Comandos
- `useSmartThingsDevices.ts` - Lista dispositivos

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
- `use-toast.ts` - ⚠️ Duplicado com toast.tsx

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
| Español | `es-ES.json` | ⚠️ Remover inicialmente |
| Deutsch | `de-DE.json` | ⚠️ Remover inicialmente |

**Recomendação**: Manter apenas PT-BR e EN-US até o projeto estabilizar.

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

### ⚠️ Verificar Necessidade

| Pacote | Motivo |
|--------|--------|
| `embla-carousel-react` | Carousel não usado |
| `react-resizable-panels` | Resizable não usado |
| `cmdk` | Command não usado |
| `vaul` | Drawer - verificar se usado |
| `input-otp` | OTP não usado |
| `next-themes` | Apenas para sonner |

### Radix UI (Base do shadcn)

Todos os `@radix-ui/*` são usados pelos componentes shadcn. Remover apenas se remover o componente correspondente.

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

## Complexidade por Arquivo

### 🔴 Alta (Refatorar)

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `Dashboard.tsx` | ~270 | Muitos handlers, mistura lógica |
| `useEquipments.ts` | ~200 | Muitas responsabilidades |
| `useTimeRoutines.ts` | ~150 | Complexo |

### 🟡 Média (Avaliar)

| Arquivo | Linhas | Observação |
|---------|--------|------------|
| `Automations.tsx` | ~150 | Pode extrair componentes |
| `Reports.tsx` | ~120 | OK, mas pode simplificar |

### 🟢 Baixa (OK)

Maioria dos componentes UI e hooks simples.
