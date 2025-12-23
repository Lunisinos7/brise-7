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
import { useTranslation } from 'react-i18next';

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditUserDialog = ({ user, open, onOpenChange }: EditUserDialogProps) => {
  const { t } = useTranslation();
  const { updateUser, updateRole, isUpdating } = useUsers();
  const { isAdmin, user: currentUser } = useAuthContext();

  const formSchema = z.object({
    fullName: z.string().min(2, t('editUser.validation.nameMinLength')),
    isActive: z.boolean(),
    role: z.enum(['admin', 'manager', 'viewer']),
  });

  type FormValues = z.infer<typeof formSchema>;

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
          <DialogTitle>{t('editUser.title')}</DialogTitle>
          <DialogDescription>
            {isOwnProfile
              ? t('editUser.ownProfileDesc')
              : t('editUser.otherProfileDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('editUser.fullName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('editUser.namePlaceholder')}
                      {...field}
                      disabled={!isAdmin && !isOwnProfile}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t('editUser.email')}</FormLabel>
              <Input value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                {t('editUser.emailCannotChange')}
              </p>
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('editUser.profileType')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isAdmin}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('editUser.selectProfile')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">{t('editUser.roles.admin')}</SelectItem>
                      <SelectItem value="manager">{t('editUser.roles.manager')}</SelectItem>
                      <SelectItem value="viewer">{t('editUser.roles.viewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      {t('editUser.onlyAdminsCanChange')}
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
                    <FormLabel>{t('editUser.activeUser')}</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {t('editUser.inactiveUserDesc')}
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
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isUpdating || (!isAdmin && !isOwnProfile)}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.save')
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
