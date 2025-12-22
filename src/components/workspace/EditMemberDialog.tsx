import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkspaceMembers, WorkspaceMember, WorkspaceRole } from '@/hooks/useWorkspaces';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  role: z.enum(['owner', 'admin', 'viewer']),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMemberDialogProps {
  member: WorkspaceMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<WorkspaceRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  viewer: 'Visualizador',
};

const EditMemberDialog = ({ member, open, onOpenChange }: EditMemberDialogProps) => {
  const { currentWorkspaceId, canManageWorkspace, isWorkspaceOwner, currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const { updateMemberRole, removeMember } = useWorkspaceMembers(currentWorkspaceId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'viewer',
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        role: member.role,
      });
    }
  }, [member, form]);

  const onSubmit = (values: FormValues) => {
    if (!member) return;

    if (values.role !== member.role) {
      updateMemberRole({ memberId: member.id, role: values.role });
    }

    onOpenChange(false);
  };

  const handleRemove = () => {
    if (!member) return;
    removeMember(member.id);
    onOpenChange(false);
  };

  const isOwnProfile = user?.id === member?.user_id;
  const isOwnerMember = member?.user_id === currentWorkspace?.owner_id;
  const canEdit = canManageWorkspace && !isOwnerMember;
  const canRemove = canManageWorkspace && !isOwnProfile && !isOwnerMember;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Membro</DialogTitle>
          <DialogDescription>
            {isOwnProfile
              ? 'Visualize suas permissões no workspace'
              : 'Gerencie as permissões deste membro'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Nome</FormLabel>
              <Input value={member?.profile?.full_name || 'Sem nome'} disabled />
            </div>

            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <Input value={member?.profile?.email || ''} disabled />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de acesso</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!canEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isWorkspaceOwner && (
                        <SelectItem value="owner">Proprietário</SelectItem>
                      )}
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canEdit && (
                    <p className="text-xs text-muted-foreground">
                      {isOwnerMember 
                        ? 'O proprietário não pode ter seu acesso alterado'
                        : 'Apenas administradores podem alterar acessos'}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-3 pt-4">
              <div>
                {canRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemove}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!canEdit}>
                  Salvar
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
