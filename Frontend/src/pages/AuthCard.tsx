import React, { useState, useEffect } from 'react';
import { Mail, Lock, Phone, User } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthCard = () => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [loginData, setLoginData] = useState({ email: '', phone: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [timer, setTimer] = useState(180); // 3 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.placeholder.toLowerCase().replace(' ', '')]: e.target.value });
  };

  const handleSignupChange = (e) => {
    const key = e.target.placeholder.toLowerCase().replace(' ', '');
    setSignupData({ ...signupData, [key]: e.target.value });
  };

  useEffect(() => {
    if (isVerifying && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [isVerifying, timer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login data:', loginData);
    try {
      // Get user's coordinates
      const position = await new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        } else {
          reject(new Error('Geolocation not supported'));
        }
      });

      const coordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      const response = await axios.post('http://127.0.0.1:5050/api/login', {
        identifier: loginData.email || loginData.phone,
        password: loginData.password,
        coordinates
      });

      console.log('Login response:', response.data);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setMessage('User logged in successfully');
      alert('User logged in successfully');

      navigate('/');
    } catch (error) {
      console.error('Login error:', error.response?.data);
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log('Signup data:', signupData);
    try {
      // Get user's coordinates
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const coordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      const response = await axios.post('http://127.0.0.1:5050/api/register', {
        ...signupData,
        coordinates
      });

      console.log('Signup response:', response.data);
      setMessage('Registration successful. Please check your email.');
      alert('Registration successful. Please check your email for verification code.');
      setTempUser(response.data.tempUser);
      localStorage.setItem('tempUser', JSON.stringify(response.data.tempUser));
      setIsVerifying(true);
      setTimer(180);
      setCanResend(false);
    } catch (error) {
      console.error('Signup error:', error.response?.data);
      setMessage(error.response?.data?.message || 'Signup failed');
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5050/api/resend-otp', {
        email: signupData.email,
      });
      console.log('Resend OTP response:', response.data);
      setMessage('New OTP sent to your email.');
      alert('New OTP sent to your email.');
      setTempUser({ ...tempUser, verificationCode: response.data.verificationCode });
      localStorage.setItem('tempUser', JSON.stringify({ ...tempUser, verificationCode: response.data.verificationCode }));
      setTimer(180); // Reset timer
      setCanResend(false);
    } catch (error) {
      console.error('Resend OTP error:', error.response?.data);
      setMessage(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    console.log('Verify data:', { email: signupData.email, emailCode: otp, tempUser });
    try {
      const response = await axios.post('http://127.0.0.1:5050/api/verify', {
        email: signupData.email,
        emailCode: otp,
        tempUser,
      });
      console.log('Verify response:', response.data);
      setMessage('Email verified successfully');
      alert('Email verified successfully');
      setIsVerifying(false);
      localStorage.removeItem('tempUser');
      setTempUser(null);
    } catch (error) {
      console.error('Verify error:', error.response?.data);
      setMessage(error.response?.data?.message || 'Verification failed');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="relative w-[400px] h-[500px] perspective-1000">
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Login Card */}
          <div className="absolute w-full h-full backface-hidden">
            <div className="w-full h-full bg-[#1a2942] rounded-2xl shadow-neon p-8 border border-blue-400/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 text-white glow-text">LOG IN</h2>
                <p className="text-blue-200">Welcome back! Log in to access the website</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="flex gap-4 justify-center mb-6">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-full transition-all duration-300 ${loginMethod === 'email' ? 'bg-blue-500 text-white shadow-blue' : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/40'}`}
                    onClick={() => setLoginMethod('email')}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-full transition-all duration-300 ${loginMethod === 'phone' ? 'bg-blue-500 text-white shadow-blue' : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/40'}`}
                    onClick={() => setLoginMethod('phone')}
                  >
                    Phone
                  </button>
                </div>
                <div className="relative">
                  {loginMethod === 'email' ? (
                    <div className="flex items-center">
                      <Mail className="absolute left-3 text-blue-300" size={20} />
                      <input
                        type="email"
                        placeholder="Email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Phone className="absolute left-3 text-blue-300" size={20} />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={loginData.phone}
                        onChange={handleLoginChange}
                        className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                      />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 text-blue-300" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors shadow-blue"
                >
                  LOG IN
                </button>
                {message && <p className="text-center text-blue-200">{message}</p>}
              </form>
              <div className="mt-6 text-center">
                <p className="text-blue-200">
                  Not registered?{' '}
                  <button onClick={handleFlip} className="text-blue-300 font-semibold hover:text-blue-200 transition-colors glow-text-sm">
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Sign Up Card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full bg-[#1a2942] rounded-2xl shadow-neon p-8 border border-blue-400/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 text-white glow-text">SIGN UP</h2>
                <p className="text-blue-200">Create your account to get started</p>
              </div>
              {!isVerifying ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 text-blue-300" size={20} />
                    <input
                      type="text"
                      placeholder="Name"
                      value={signupData.name}
                      onChange={handleSignupChange}
                      className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 text-blue-300" size={20} />
                    <input
                      type="email"
                      placeholder="Email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 text-blue-300" size={20} />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 text-blue-300" size={20} />
                    <input
                      type="password"
                      placeholder="Password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className="w-full pl-12 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors shadow-blue"
                  >
                    SIGN UP
                  </button>
                  {message && <p className="text-center text-blue-200">{message}</p>}
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-4 pr-4 py-3 rounded-full bg-blue-900/40 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-blue-400/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors shadow-blue"
                  >
                    VERIFY OTP
                  </button>
                  <div className="text-center">
                    <p className="text-blue-200">
                      Time remaining: {formatTime(timer)}
                    </p>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={!canResend}
                      className={`mt-2 px-4 py-2 rounded-full transition-all duration-300 ${
                        canResend ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Resend OTP
                    </button>
                  </div>
                  {message && <p className="text-center text-blue-200">{message}</p>}
                </form>
              )}
              <div className="mt-6 text-center">
                <p className="text-blue-200">
                  Already have an account?{' '}
                  <button onClick={handleFlip} className="text-blue-300 font-semibold hover:text-blue-200 transition-colors glow-text-sm">
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
