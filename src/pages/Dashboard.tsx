import { useState } from "react";
import StatusCard from "@/components/dashboard/StatusCard";
import { AccumulatedExpenseCard } from "@/components/dashboard/AccumulatedExpenseCard";
import EquipmentControlDialog from "@/components/dashboard/EquipmentControlDialog";
import EnvironmentControlDialog from "@/components/dashboard/EnvironmentControlDialog";
import CreateEnvironmentDialog from "@/components/dashboard/CreateEnvironmentDialog";
import EditEnvironmentDialog from "@/components/dashboard/EditEnvironmentDialog";
import EnvironmentCard from "@/components/dashboard/EnvironmentCard";
import { mockAlerts } from "@/data/mockData";
import { useEquipments } from "@/hooks/useEquipments";
import { Wind, Zap, Thermometer, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const { currentWorkspaceId } = useWorkspaceContext();
  const { equipments, updateEquipment, isLoading } = useEquipments(currentWorkspaceId);
  const { environments, addEnvironment, updateEnvironment, removeEnvironment } = useEnvironments();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [isCreateEnvironmentOpen, setIsCreateEnvironmentOpen] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [isEnvironmentControlOpen, setIsEnvironmentControlOpen] = useState(false);
  const [isEditEnvironmentOpen, setIsEditEnvironmentOpen] = useState(false);
  const [environmentToEdit, setEnvironmentToEdit] = useState<string | null>(null);
  const [environmentToDelete, setEnvironmentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedEquipment = selectedEquipmentId ? equipments.find(eq => eq.id === selectedEquipmentId) ?? null : null;
  const selectedEnvironment = selectedEnvironmentId ? environments.find(env => env.id === selectedEnvironmentId) : null;
  const selectedEnvironmentEquipments = selectedEnvironment 
    ? equipments.filter(eq => selectedEnvironment.equipmentIds.includes(eq.id))
    : [];
  
  const environmentBeingEdited = environmentToEdit ? environments.find(env => env.id === environmentToEdit) ?? null : null;
  const environmentBeingDeleted = environmentToDelete ? environments.find(env => env.id === environmentToDelete) : null;

  // Equipamentos já vinculados a algum ambiente
  const assignedEquipmentIds = environments.flatMap(env => env.equipmentIds);
  const availableEquipments = equipments.filter(eq => !assignedEquipmentIds.includes(eq.id));
  const totalEquipments = equipments.length;
  const activeEquipments = equipments.filter(eq => eq.isOn).length;
  const totalConsumption = equipments.reduce((sum, eq) => sum + eq.energyConsumption, 0);
  const avgTemp = Math.round(equipments.filter(eq => eq.isOn).reduce((sum, eq) => sum + eq.currentTemp, 0) / activeEquipments || 0);
  
  const handleToggleEquipment = async (id: string) => {
    const equipment = equipments.find(eq => eq.id === id);
    if (!equipment) return;
    
    const newState = !equipment.isOn;
    try {
      await updateEquipment({
        ...equipment,
        isOn: newState,
        energyConsumption: newState ? equipment.capacity * 0.8 : 0
      });
      toast({
        title: newState ? "Equipamento Ligado" : "Equipamento Desligado",
        description: `${equipment.name} foi ${newState ? "ligado" : "desligado"} com sucesso.`
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o estado do equipamento.",
        variant: "destructive"
      });
    }
  };

  const handleControlEquipment = (id: string) => {
    setSelectedEquipmentId(id);
    setIsControlDialogOpen(true);
  };

  const handleEquipmentUpdate = async (id: string, updates: any) => {
    const equipment = equipments.find(eq => eq.id === id);
    if (!equipment) return;
    
    try {
      await updateEquipment({ ...equipment, ...updates });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o equipamento.",
        variant: "destructive"
      });
    }
  };

  const handleCreateEnvironment = async (name: string, selectedEquipmentIds: string[]) => {
    const created = await addEnvironment({
      name,
      equipmentIds: selectedEquipmentIds,
      isActive: true,
      isAutomatic: false,
      coolingEnabled: true,
      heatingEnabled: true,
      coolTriggerTemp: 28,
      coolTargetTemp: 24,
      heatTriggerTemp: 18,
      heatTargetTemp: 22,
    });
    if (created) {
      toast({
        title: "Ambiente Criado",
        description: `${name} foi criado com ${selectedEquipmentIds.length} equipamento(s) vinculado(s).`,
      });
    }
  };

  const handleControlEnvironment = (environmentId: string) => {
    setSelectedEnvironmentId(environmentId);
    setIsEnvironmentControlOpen(true);
  };

  const handleEnvironmentUpdate = async (updates: Partial<typeof equipments[0]>) => {
    if (!selectedEnvironment) return;
    
    try {
      // Apply updates to all linked equipments
      const updatePromises = selectedEnvironmentEquipments.map(eq => 
        updateEquipment({ ...eq, ...updates })
      );
      await Promise.all(updatePromises);
      
      toast({
        title: "Ambiente Atualizado",
        description: `${selectedEnvironmentEquipments.length} equipamento(s) atualizado(s) com sucesso.`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os equipamentos do ambiente.",
        variant: "destructive"
      });
    }
  };

  const handleEditEnvironment = (environmentId: string) => {
    setEnvironmentToEdit(environmentId);
    setIsEditEnvironmentOpen(true);
  };

  const handleUpdateEnvironment = (id: string, name: string, equipmentIds: string[]) => {
    updateEnvironment(id, { name, equipmentIds });
    toast({
      title: "Ambiente Atualizado",
      description: `${name} foi atualizado com sucesso.`,
    });
  };

  const handleDeleteEnvironment = (environmentId: string) => {
    setEnvironmentToDelete(environmentId);
  };

  const handleToggleEnvironment = async (environmentId: string, isActive: boolean) => {
    const env = environments.find(e => e.id === environmentId);
    await updateEnvironment(environmentId, { isActive });
    toast({
      title: isActive ? "Ambiente Ativado" : "Ambiente Pausado",
      description: `${env?.name || "Ambiente"} foi ${isActive ? "ativado" : "pausado"}.`,
    });
  };

  const confirmDeleteEnvironment = () => {
    if (environmentToDelete) {
      const env = environments.find(e => e.id === environmentToDelete);
      removeEnvironment(environmentToDelete);
      toast({
        title: "Ambiente Excluído",
        description: `${env?.name || "Ambiente"} foi excluído com sucesso.`,
      });
      setEnvironmentToDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de climatização
          </p>
        </div>
        <Button onClick={() => setIsCreateEnvironmentOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Ambiente
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard title="Equipamentos Ativos" value={`${activeEquipments}/${totalEquipments}`} description="Equipamentos em operação" icon={Wind} variant="cooling" />
        <StatusCard title="Consumo Total" value={`${(totalConsumption / 1000).toFixed(1)}kW`} description="Consumo energético atual" icon={Zap} variant="energy" />
        <StatusCard title="Temperatura Média" value={`${avgTemp}°C`} description="Média dos ambientes ativos" icon={Thermometer} variant="cooling" />
        <AccumulatedExpenseCard workspaceId={currentWorkspaceId} />
        <StatusCard title="Alertas Ativos" value={mockAlerts.length} description="Requer atenção" icon={AlertTriangle} variant="heating" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Ambientes</h2>
        {environments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {environments.map(environment => (
              <EnvironmentCard 
                key={environment.id} 
                environment={environment} 
                equipments={equipments}
                onControlEnvironment={handleControlEnvironment}
                onEditEnvironment={handleEditEnvironment}
                onDeleteEnvironment={handleDeleteEnvironment}
                onToggleEnvironment={handleToggleEnvironment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhum ambiente criado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Criar Novo Ambiente" para começar.
            </p>
          </div>
        )}
      </div>

      <EquipmentControlDialog equipment={selectedEquipment} isOpen={isControlDialogOpen} onClose={() => setIsControlDialogOpen(false)} onUpdate={handleEquipmentUpdate} />
      
      <CreateEnvironmentDialog
        isOpen={isCreateEnvironmentOpen}
        onClose={() => setIsCreateEnvironmentOpen(false)}
        equipments={availableEquipments}
        onCreateEnvironment={handleCreateEnvironment}
      />

      <EditEnvironmentDialog
        isOpen={isEditEnvironmentOpen}
        onClose={() => {
          setIsEditEnvironmentOpen(false);
          setEnvironmentToEdit(null);
        }}
        environment={environmentBeingEdited}
        allEquipments={equipments}
        assignedEquipmentIds={assignedEquipmentIds}
        onUpdateEnvironment={handleUpdateEnvironment}
      />

      <EnvironmentControlDialog
        isOpen={isEnvironmentControlOpen}
        onClose={() => setIsEnvironmentControlOpen(false)}
        environment={selectedEnvironment || null}
        equipments={selectedEnvironmentEquipments}
        onUpdateEquipments={handleEnvironmentUpdate}
        onUpdateEnvironment={async (updates) => {
          if (selectedEnvironment) {
            await updateEnvironment(selectedEnvironment.id, updates);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!environmentToDelete} onOpenChange={(open) => !open && setEnvironmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ambiente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ambiente "{environmentBeingDeleted?.name}"? 
              Esta ação não pode ser desfeita. Os equipamentos vinculados não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEnvironment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <div className="flex justify-end">
        <p className="text-xs text-muted-foreground">
          Última atualização: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
