import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { AppRole } from '@/hooks/useAuth';

const formSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  isActive: z.boolean(),
  role: z.enum(['admin', 'manager', 'viewer']),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditUserDialog = ({ user, open, onOpenChange }: EditUserDialogProps) => {
  const { updateUser, updateRole, isUpdating } = useUsers();
  const { isAdmin, user: currentUser } = useAuthContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      isActive: true,
      role: 'viewer',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.full_name || '',
        isActive: user.is_active,
        role: user.role,
      });
    }
  }, [user, form]);

  const onSubmit = (values: FormValues) => {
    if (!user) return;

    // Update profile
    updateUser({
      userId: user.id,
      fullName: values.fullName,
      isActive: values.isActive,
    });

    // Update role if admin and role changed
    if (isAdmin && values.role !== user.role) {
      updateRole({
        userId: user.id,
        role: values.role as AppRole,
      });
    }

    onOpenChange(false);
  };

  const isOwnProfile = currentUser?.id === user?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            {isOwnProfile
              ? 'Edite suas informações de perfil'
              : 'Visualize e edite as informações do usuário'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do usuário"
                      {...field}
                      disabled={!isAdmin && !isOwnProfile}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <Input value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de perfil</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isAdmin}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Apenas administradores podem alterar perfis
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Usuário ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Usuários inativos não podem acessar o sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isAdmin || isOwnProfile}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating || (!isAdmin && !isOwnProfile)}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
