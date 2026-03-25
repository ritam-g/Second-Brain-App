import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { notify } from '../../lib/toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { loginUser, loading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      notify.warning('Enter both email and password to continue.', { toastId: 'login-validation' });
      return;
    }

    const result = await loginUser({ email: email.trim(), password });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl shadow-indigo-100 p-8 border border-white">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 mt-2 text-center text-sm">Log in to access your curated digital library.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 relative"
          />
          <InputField
            label="Password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 relative"
          />

          <Button
            type="submit"
            className="w-full py-3 mt-4 text-base rounded-xl"
            loading={loading}
          >
            Log In
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-semibold">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
