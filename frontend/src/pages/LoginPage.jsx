import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { authUtils } from '@/utils/auth';
import { toast } from 'sonner';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      await authUtils.login(data.email, data.password);

      toast.success('Login successful!');

      // Redirect to the intended page or home
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md bg-slate-800 border-slate-700'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center text-white'>
            Welcome Back
          </CardTitle>
          <CardDescription className='text-center text-slate-400'>
            Sign in to your AR Configurator account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-white'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                {...register('email')}
                className={`bg-slate-700 border-slate-600 text-white placeholder-slate-400 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className='text-sm text-red-400'>{errors.email.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-white'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  {...register('password')}
                  className={`bg-slate-700 border-slate-600 text-white placeholder-slate-400 ${errors.password ? 'border-red-500' : ''}`}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-slate-600 text-slate-400'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                  <span className='sr-only'>
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className='text-sm text-red-400'>
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className='flex flex-col space-y-4'>
            <Button 
              type='submit' 
              className='w-full bg-blue-600 hover:bg-blue-700 text-white' 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className='text-center text-sm text-slate-400'>
              <p>
                Don't have an account?{' '}
                <Link
                  to='/register'
                  className='font-medium text-blue-400 hover:text-blue-300 underline'
                >
                  Create one now
                </Link>
              </p>
            </div>

            <div className='text-center text-sm text-slate-500'>
              <p>Demo accounts:</p>
              <p className='text-xs'>
                Admin: admin@example.com / admin123
                <br />
                User: user@example.com / user123
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
