import { useState } from "react";
import { useTranslation } from "react-i18next";
import StatusCard from "@/components/dashboard/StatusCard";
import { AccumulatedExpenseCard } from "@/components/dashboard/AccumulatedExpenseCard";
import EquipmentControlDialog from "@/components/dashboard/EquipmentControlDialog";
import EnvironmentControlDialog from "@/components/dashboard/EnvironmentControlDialog";
import CreateEnvironmentDialog from "@/components/dashboard/CreateEnvironmentDialog";
import EditEnvironmentDialog from "@/components/dashboard/EditEnvironmentDialog";
import EnvironmentCard from "@/components/dashboard/EnvironmentCard";
import { useEquipments } from "@/hooks/useEquipments";
import { Wind, Zap, Thermometer, Plus } from "lucide-react";
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
  const { t } = useTranslation();
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
        title: newState ? t('dashboard.equipmentOn') : t('dashboard.equipmentOff'),
        description: t('dashboard.equipmentToggleSuccess', { name: equipment.name, state: newState ? t('dashboard.turnedOn') : t('dashboard.turnedOff') })
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('dashboard.errorToggleEquipment'),
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
        title: t('common.error'),
        description: t('dashboard.errorUpdateEquipment'),
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
        title: t('dashboard.environmentCreated'),
        description: t('dashboard.environmentCreatedDesc', { name, count: selectedEquipmentIds.length }),
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
        title: t('dashboard.environmentUpdated'),
        description: t('dashboard.environmentUpdatedDesc', { count: selectedEnvironmentEquipments.length }),
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('dashboard.errorUpdateEnvironment'),
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
      title: t('dashboard.environmentUpdated'),
      description: t('dashboard.environmentUpdatedDesc', { count: equipmentIds.length }),
    });
  };

  const handleDeleteEnvironment = (environmentId: string) => {
    setEnvironmentToDelete(environmentId);
  };

  const handleToggleEnvironment = async (environmentId: string, isActive: boolean) => {
    const env = environments.find(e => e.id === environmentId);
    await updateEnvironment(environmentId, { isActive });
    toast({
      title: isActive ? t('dashboard.environmentActivated') : t('dashboard.environmentPaused'),
      description: t('dashboard.equipmentToggleSuccess', { name: env?.name, state: isActive ? t('dashboard.turnedOn') : t('dashboard.turnedOff') }),
    });
  };

  const confirmDeleteEnvironment = () => {
    if (environmentToDelete) {
      const env = environments.find(e => e.id === environmentToDelete);
      removeEnvironment(environmentToDelete);
      toast({
        title: t('dashboard.environmentDeleted'),
        description: t('dashboard.environmentDeletedDesc', { name: env?.name }),
      });
      setEnvironmentToDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreateEnvironmentOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('dashboard.createEnvironment')}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard title={t('dashboard.activeEquipments')} value={`${activeEquipments}/${totalEquipments}`} description={t('dashboard.activeEquipmentsDesc')} icon={Wind} variant="cooling" />
        <StatusCard title={t('dashboard.totalConsumption')} value={`${(totalConsumption / 1000).toFixed(1)}kW`} description={t('dashboard.totalConsumptionDesc')} icon={Zap} variant="energy" />
        <StatusCard title={t('dashboard.averageTemperature')} value={`${avgTemp}°C`} description={t('dashboard.averageTemperatureDesc')} icon={Thermometer} variant="cooling" />
        <AccumulatedExpenseCard workspaceId={currentWorkspaceId} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('dashboard.environments')}</h2>
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
            <p className="text-muted-foreground">{t('dashboard.noEnvironments')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('dashboard.noEnvironmentsHint')}
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
            <AlertDialogTitle>{t('dashboard.deleteEnvironmentTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.deleteEnvironmentDesc', { name: environmentBeingDeleted?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEnvironment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <div className="fixed bottom-4 right-4">
        <p className="text-xs text-muted-foreground">
          {t('common.lastUpdate')}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
