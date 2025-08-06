import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildApiUrl } from '@/utils/config.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, User, Mail, Lock } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to AR Experience Platform.',
      });

      // Store token in localStorage as backup
      localStorage.setItem('auth_token', data.token);

      // Redirect to dashboard
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: 'Registration failed',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <Button
            variant='ghost'
            onClick={() => navigate('/')}
            className='mb-4 text-slate-400 hover:text-white'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Home
          </Button>
          <h1 className='text-3xl font-bold text-white mb-2'>Create Account</h1>
          <p className='text-slate-400'>
            Join us to create amazing AR experiences
          </p>
        </div>

        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader>
            <CardTitle className='text-white'>Sign Up</CardTitle>
            <CardDescription className='text-slate-400'>
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-slate-200'>
                  Full Name
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    id='name'
                    type='text'
                    placeholder='Enter your full name'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className='bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email' className='text-slate-200'>
                  Email
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className='bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='text-slate-200'>
                  Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Create a password'
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    className='bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 pl-10 pr-10'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-slate-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-slate-400' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='text-slate-200'>
                  Confirm Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm your password'
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange('confirmPassword', e.target.value)
                    }
                    className='bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 pl-10 pr-10'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4 text-slate-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-slate-400' />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type='submit'
                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending
                  ? 'Creating account...'
                  : 'Create Account'}
              </Button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-slate-400'>
                Already have an account?{' '}
                <Link
                  to='/login'
                  className='text-blue-400 hover:text-blue-300 font-medium'
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
