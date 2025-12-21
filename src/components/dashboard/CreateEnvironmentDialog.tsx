import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/hooks/useEquipments";

interface CreateEnvironmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  onCreateEnvironment: (name: string, selectedEquipmentIds: string[]) => void;
}

const CreateEnvironmentDialog = ({
  isOpen,
  onClose,
  equipments,
  onCreateEnvironment,
}: CreateEnvironmentDialogProps) => {
  const [environmentName, setEnvironmentName] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);

  const handleToggleEquipment = (equipmentId: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleSubmit = () => {
    if (environmentName.trim()) {
      onCreateEnvironment(environmentName.trim(), selectedEquipments);
      setEnvironmentName("");
      setSelectedEquipments([]);
      onClose();
    }
  };

  const handleClose = () => {
    setEnvironmentName("");
    setSelectedEquipments([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Ambiente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="environment-name">Nome do Ambiente</Label>
            <Input
              id="environment-name"
              placeholder="Ex: Sala de Reuniões B"
              value={environmentName}
              onChange={(e) => setEnvironmentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Equipamentos a serem vinculados</Label>
            <div className="border rounded-md bg-background">
              <ScrollArea className="h-48 p-3">
                <div className="space-y-3">
                  {equipments.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`equipment-${equipment.id}`}
                        checked={selectedEquipments.includes(equipment.id)}
                        onCheckedChange={() => handleToggleEquipment(equipment.id)}
                      />
                      <label
                        htmlFor={`equipment-${equipment.id}`}
                        className="flex-1 cursor-pointer text-sm font-medium"
                      >
                        {equipment.name} - {equipment.model}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedEquipments.length} equipamento(s) selecionado(s)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!environmentName.trim() || selectedEquipments.length === 0}
          >
            Criar Ambiente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEnvironmentDialog;
