import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wind, Info } from "lucide-react";
import { Equipment } from "@/hooks/useEquipments";
import { Environment } from "@/contexts/EnvironmentContext";

interface EditEnvironmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  environment: Environment | null;
  allEquipments: Equipment[];
  assignedEquipmentIds: string[];
  onUpdateEnvironment: (id: string, name: string, equipmentIds: string[]) => void;
}

const EditEnvironmentDialog = ({
  isOpen,
  onClose,
  environment,
  allEquipments,
  assignedEquipmentIds,
  onUpdateEnvironment,
}: EditEnvironmentDialogProps) => {
  const { t } = useTranslation();
  const [environmentName, setEnvironmentName] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);

  // Equipamentos disponíveis: não atribuídos OU já vinculados a este ambiente
  const availableEquipments = allEquipments.filter(
    (eq) =>
      !assignedEquipmentIds.includes(eq.id) ||
      (environment && environment.equipmentIds.includes(eq.id))
  );

  useEffect(() => {
    if (environment) {
      setEnvironmentName(environment.name);
      setSelectedEquipments(environment.equipmentIds);
    }
  }, [environment]);

  const handleToggleEquipment = (equipmentId: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleSubmit = () => {
    if (environment && environmentName.trim() && selectedEquipments.length > 0) {
      onUpdateEnvironment(environment.id, environmentName.trim(), selectedEquipments);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editEnvironmentDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("editEnvironmentDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-environment-name">{t("editEnvironmentDialog.environmentName")}</Label>
            <Input
              id="edit-environment-name"
              placeholder={t("editEnvironmentDialog.namePlaceholder")}
              value={environmentName}
              onChange={(e) => setEnvironmentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("editEnvironmentDialog.linkedEquipments")}</Label>
            
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                {t("editEnvironmentDialog.syncWarning")}
              </AlertDescription>
            </Alert>
            
            {availableEquipments.length > 0 ? (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {availableEquipments.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => handleToggleEquipment(equipment.id)}
                    >
                      <Checkbox
                        id={`edit-eq-${equipment.id}`}
                        checked={selectedEquipments.includes(equipment.id)}
                        onCheckedChange={() => handleToggleEquipment(equipment.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Wind className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{equipment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {equipment.model} • {equipment.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                {t("editEnvironmentDialog.noEquipments")}
              </p>
            )}
            {selectedEquipments.length === 0 && (
              <p className="text-sm text-destructive">
                {t("editEnvironmentDialog.selectAtLeastOne")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!environmentName.trim() || selectedEquipments.length === 0}
          >
            {t("common.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEnvironmentDialog;
