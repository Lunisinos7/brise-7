import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Circle } from 'lucide-react';
const Auth = () => {
  const navigate = useNavigate();
  const {
    user,
    loading,
    signIn,
    signUp
  } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    t
  } = useTranslation();
  const loginSchema = z.object({
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordMinLength'))
  });
  const signupSchema = z.object({
    fullName: z.string().min(2, t('auth.validation.nameMinLength')),
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordMinLength')),
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsNotMatch'),
    path: ['confirmPassword']
  });
  type LoginFormValues = z.infer<typeof loginSchema>;
  type SignupFormValues = z.infer<typeof signupSchema>;
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  const handleLogin = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    const {
      error
    } = await signIn(values.email, values.password);
    setIsSubmitting(false);
    if (!error) {
      navigate('/');
    }
  };
  const handleSignup = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    const {
      error
    } = await signUp(values.email, values.password, values.fullName);
    setIsSubmitting(false);
    if (!error) {
      navigate('/');
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Circle className="w-[28px] h-[28px] rounded-full opacity-100 border-[#17a1cf] bg-black/0 text-black/0 border-8" />
            <h1 className="text-2xl font-bold text-[#17a1cf]">
              {t('brand.name')}
            </h1>
          </div>
          <CardTitle className="text-primary">{t('auth.welcome')}</CardTitle>
          <CardDescription>
            {t('auth.loginOrSignup')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>{t('auth.email')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.emailPlaceholder')} type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={loginForm.control} name="password" render={({
                  field
                }) => <FormItem>
                        <FormLabel>{t('auth.password')}</FormLabel>
                        <FormControl>
                          <Input placeholder="••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.loggingIn')}
                      </> : t('auth.login')}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <FormField control={signupForm.control} name="fullName" render={({
                  field
                }) => <FormItem>
                        <FormLabel>{t('auth.fullName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.namePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={signupForm.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>{t('auth.email')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.emailPlaceholder')} type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={signupForm.control} name="password" render={({
                  field
                }) => <FormItem>
                        <FormLabel>{t('auth.password')}</FormLabel>
                        <FormControl>
                          <Input placeholder="••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={signupForm.control} name="confirmPassword" render={({
                  field
                }) => <FormItem>
                        <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input placeholder="••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.signingUp')}
                      </> : t('auth.createAccount')}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;