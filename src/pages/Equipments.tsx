import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddEquipmentDialog } from "@/components/equipments/AddEquipmentDialog";
import { EditEquipmentDialog } from "@/components/equipments/EditEquipmentDialog";
import { useEquipments, Equipment } from "@/hooks/useEquipments";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { Search, Filter, Plus, Pencil, Loader2 } from "lucide-react";

const Equipments = () => {
  const { currentWorkspaceId } = useWorkspaceContext();
  const { equipments, isLoading, addEquipment, updateEquipment, deleteEquipment } = useEquipments(currentWorkspaceId);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const filteredEquipments = equipments.filter(
    (eq) =>
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEquipment = async (equipment: Omit<Equipment, "id">) => {
    await addEquipment(equipment);
  };

  const handleEditEquipment = async (updatedEquipment: Equipment) => {
    await updateEquipment(updatedEquipment);
  };

  const handleDeleteEquipment = async (id: string) => {
    await deleteEquipment(id);
  };

  const openEditDialog = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEditDialog(true);
  };

  const getStatusBadge = (isOn: boolean) => (
    <Badge variant={isOn ? "default" : "secondary"} className="gap-1">
      <div
        className={`w-2 h-2 rounded-full ${
          isOn ? "bg-energy-efficient" : "bg-muted-foreground"
        }`}
      />
      {isOn ? "Ativo" : "Inativo"}
    </Badge>
  );

  const getIntegrationBadge = (integration: string) => (
    <Badge
      variant="outline"
      className={
        integration === "SMART"
          ? "border-cooling text-cooling"
          : "border-energy-efficient text-energy-efficient"
      }
    >
      {integration}
    </Badge>
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cooling" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os equipamentos de climatização
          </p>
        </div>
        <Button
          variant="cooling"
          className="gap-2"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Adicionar Equipamento
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Equipment List */}
      <div className="grid gap-4">
        {filteredEquipments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum equipamento encontrado" : "Nenhum equipamento cadastrado. Clique em 'Adicionar Equipamento' para começar."}
            </p>
          </Card>
        ) : (
          filteredEquipments.map((equipment) => (
            <Card
              key={equipment.id}
              className="hover:shadow-elevated transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{equipment.name}</CardTitle>
                    <p className="text-muted-foreground">{equipment.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(equipment.isOn)}
                    {getIntegrationBadge(equipment.integration)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{equipment.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="font-medium">
                      {equipment.capacity.toLocaleString()} BTU/h
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperatura</p>
                    <p className="font-medium">
                      {equipment.currentTemp}°C / {equipment.targetTemp}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consumo</p>
                    <p className="font-medium">{equipment.energyConsumption}W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Eficiência</p>
                    <p className="font-medium">{equipment.efficiency}%</p>
                  </div>
                  <div className="flex gap-2 items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(equipment)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddEquipmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddEquipment={handleAddEquipment}
      />

      <EditEquipmentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        equipment={selectedEquipment}
        onEditEquipment={handleEditEquipment}
        onDeleteEquipment={handleDeleteEquipment}
      />
    </div>
  );
};

export default Equipments;
