# Guia de Refatoração

Checklist de ações para simplificar o projeto.

---

## Fase 1: Limpeza de Dependências

### 1.1 Remover Componentes UI Não Usados

```bash
# Candidatos a remoção (verificar antes)
src/components/ui/aspect-ratio.tsx
src/components/ui/breadcrumb.tsx
src/components/ui/carousel.tsx
src/components/ui/command.tsx
src/components/ui/context-menu.tsx
src/components/ui/hover-card.tsx
src/components/ui/input-otp.tsx
src/components/ui/menubar.tsx
src/components/ui/navigation-menu.tsx
src/components/ui/pagination.tsx
src/components/ui/resizable.tsx
src/components/ui/sidebar.tsx
src/components/ui/toggle.tsx
src/components/ui/toggle-group.tsx
```

**Ações:**
- [ ] Buscar imports de cada componente no projeto
- [ ] Confirmar que não são usados
- [ ] Deletar arquivos não usados
- [ ] Remover pacotes Radix correspondentes

### 1.2 Remover Pacotes NPM

```bash
# Remover se componentes não usados
npm uninstall embla-carousel-react  # carousel
npm uninstall react-resizable-panels  # resizable
npm uninstall cmdk  # command
npm uninstall input-otp  # input-otp
```

---

## Fase 2: Consolidar Hooks

### 2.1 Criar Módulo BRISE

```typescript
// src/hooks/brise/index.ts
export { useBriseConfig } from './useBriseConfig';
export { useBriseControl } from './useBriseControl';
export { useBriseDevices } from './useBriseDevices';
export { useBriseSync } from './useBriseSync';
```

**Ações:**
- [ ] Criar pasta `src/hooks/brise/`
- [ ] Mover hooks BRISE para a pasta
- [ ] Criar `index.ts` com exports
- [ ] Atualizar imports em componentes

### 2.2 Criar Módulo SmartThings

```typescript
// src/hooks/smartthings/index.ts
export { useSmartThingsConfig } from './useSmartThingsConfig';
export { useSmartThingsControl } from './useSmartThingsControl';
export { useSmartThingsDevices } from './useSmartThingsDevices';
```

**Ações:**
- [ ] Criar pasta `src/hooks/smartthings/`
- [ ] Mover hooks SmartThings para a pasta
- [ ] Criar `index.ts` com exports
- [ ] Atualizar imports em componentes

### 2.3 Unificar Toast

**Problema:** Existem dois arquivos de toast:
- `src/hooks/use-toast.ts`
- `src/components/ui/use-toast.ts`

**Ação:**
- [ ] Verificar qual é usado
- [ ] Remover duplicado
- [ ] Padronizar imports

---

## Fase 3: Simplificar Páginas

### 3.1 Refatorar Dashboard.tsx

**Problema:** ~270 linhas com muitos handlers misturados.

**Solução:** Extrair lógica para hook `useDashboardHandlers`.

```typescript
// src/hooks/useDashboardHandlers.ts
export function useDashboardHandlers() {
  // handleToggleEquipment
  // handleCreateEnvironment
  // handleEditEnvironment
  // handleDeleteEnvironment
  // handleControlEnvironment
  // handleToggleEnvironment
  
  return {
    handleToggleEquipment,
    handleCreateEnvironment,
    // ...
  };
}
```

**Ações:**
- [ ] Criar `useDashboardHandlers.ts`
- [ ] Mover handlers do Dashboard
- [ ] Dashboard fica só com renderização
- [ ] Meta: Dashboard com ~100 linhas

### 3.2 Extrair Componentes do Dashboard

**Componentes a criar:**
- [ ] `EnvironmentList.tsx` - Grid de ambientes
- [ ] `DashboardHeader.tsx` - Título e botão criar
- [ ] `DashboardStats.tsx` - Cards de status

---

## Fase 4: Simplificar Internacionalização

### 4.1 Remover Idiomas Não Essenciais

**Ações:**
- [ ] Remover `src/locales/es-ES.json`
- [ ] Remover `src/locales/de-DE.json`
- [ ] Atualizar `src/lib/i18n.ts` para suportar apenas pt-BR e en-US
- [ ] Atualizar `LanguageSelector.tsx`

---

## Fase 5: Documentação Final

### 5.1 Atualizar README.md

- [ ] Instruções de instalação
- [ ] Como rodar localmente
- [ ] Variáveis de ambiente necessárias
- [ ] Link para documentação de arquitetura

### 5.2 Atualizar ARCHITECTURE.md

- [ ] Refletir nova estrutura após refatoração
- [ ] Atualizar diagramas
- [ ] Remover referências a componentes removidos

---

## Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| Arquivos em `components/ui/` | 50 | ~35 |
| Hooks na raiz | 20 | ~12 |
| Linhas do Dashboard | ~270 | ~100 |
| Idiomas suportados | 4 | 2 |
| Pacotes NPM | ~60 | ~50 |

---

## Ordem de Execução Recomendada

1. **Primeiro:** Remover componentes UI não usados (baixo risco)
2. **Segundo:** Consolidar hooks em módulos (médio risco)
3. **Terceiro:** Refatorar Dashboard (alto impacto)
4. **Quarto:** Simplificar i18n (baixo risco)
5. **Último:** Atualizar documentação

---

## Comandos Úteis

```bash
# Buscar uso de um componente
grep -r "from.*ui/carousel" src/

# Contar linhas de um arquivo
wc -l src/pages/Dashboard.tsx

# Listar todos os imports de um diretório
grep -rh "^import" src/hooks/ | sort | uniq

# Verificar dependências não usadas
npx depcheck
```
