import React, { useState } from 'react';
import { useRegister } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import { BrainCircuit } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  const { registerUser, loading, error, setError } = useRegister();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(error) setError(null);
    
    if(!email || !password || !username) return;
    
    const result = await registerUser({ username, email, password });
    if(result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl shadow-indigo-100 p-8 border border-white">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Second Brain</h2>
          <p className="text-slate-500 mt-2 text-center text-sm">Start your digital curation journey.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 block"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField 
            label="Full Name" 
            type="text" 
            placeholder="John Doe" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <InputField 
            label="Email Address" 
            type="email" 
            placeholder="name@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputField 
            label="Create Password" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button 
            type="submit" 
            className="w-full py-3 mt-6 text-base rounded-xl" 
            loading={loading}
          >
            Create My Second Brain
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-semibold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
