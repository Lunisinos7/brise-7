import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@/hooks/useEquipments";
import { Trash2 } from "lucide-react";

interface EditEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onEditEquipment: (equipment: Equipment) => Promise<void>;
  onDeleteEquipment: (id: string) => Promise<void>;
}

export function EditEquipmentDialog({ 
  open, 
  onOpenChange, 
  equipment,
  onEditEquipment,
  onDeleteEquipment 
}: EditEquipmentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const equipmentSchema = z.object({
    name: z.string().min(1, t("equipments.validation.nameRequired")),
    location: z.string().min(1, t("equipments.validation.locationRequired")),
    model: z.string().min(1, t("equipments.validation.modelRequired")),
    capacity: z.string().min(1, t("equipments.validation.capacityRequired")),
    integration: z.enum(["BRISE", "SMART"], {
      required_error: t("equipments.validation.integrationRequired"),
    }),
  });

  type EquipmentFormData = z.infer<typeof equipmentSchema>;

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      location: "",
      model: "",
      capacity: "",
      integration: undefined,
    },
  });

  useEffect(() => {
    if (equipment) {
      form.reset({
        name: equipment.name,
        location: equipment.location,
        model: equipment.model || "",
        capacity: equipment.capacity?.toString() || "",
        integration: equipment.integration || "SMART",
      });
    }
  }, [equipment, form]);

  const onSubmit = async (data: EquipmentFormData) => {
    if (!equipment) return;
    
    setIsLoading(true);
    
    try {
      const updatedEquipment: Equipment = {
        ...equipment,
        name: data.name,
        location: data.location,
        model: data.model,
        capacity: parseInt(data.capacity),
        integration: data.integration,
      };
      
      await onEditEquipment(updatedEquipment);

      toast({
        title: t("equipments.editDialog.successTitle"),
        description: t("equipments.editDialog.successDesc", { name: data.name }),
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("equipments.editDialog.errorTitle"),
        description: t("equipments.editDialog.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;
    
    setIsLoading(true);
    
    try {
      await onDeleteEquipment(equipment.id);

      toast({
        title: t("equipments.editDialog.deleteSuccessTitle"),
        description: t("equipments.editDialog.deleteSuccessDesc", { name: equipment.name }),
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("equipments.editDialog.deleteErrorTitle"),
        description: t("equipments.editDialog.deleteErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("equipments.editDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("equipments.editDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("equipments.equipmentName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("equipments.placeholders.name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("equipments.location")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("equipments.placeholders.location")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("equipments.model")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("equipments.placeholders.model")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("equipments.capacity")} (BTU/h)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t("equipments.placeholders.capacity")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="integration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("equipments.integrationType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("equipments.selectType")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SMART">SMART</SelectItem>
                      <SelectItem value="BRISE">BRISE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("common.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("equipments.editDialog.confirmDelete")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("equipments.editDialog.confirmDeleteDesc", { name: equipment?.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" variant="cooling" disabled={isLoading}>
                  {isLoading ? t("common.saving") : t("common.saveChanges")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
