"use client";

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin, Calendar, Upload, X, Sun, Moon, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({
    employee_code: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhoto(null);
  };

  const handleSubmit = () => {
    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Registration submitted:', formData);
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-auto py-8 ${
      isDarkMode ? 'dark' : ''
    }`}>
      {/* Backdrop Blur Overlay */}
      <div className="absolute inset-0 bg-gray-900/60 dark:bg-gray-950/80 backdrop-blur-lg"></div>

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 transition-colors duration-500">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun size={20} className="text-yellow-500" />
        ) : (
          <Moon size={20} className="text-gray-700" />
        )}
      </button>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <h1 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h1>
              <p className="text-blue-100">
                Join PMS/HRMS - Step {currentStep} of 3
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800">
            <div 
              className="absolute h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>

          {/* Form */}
          <div className="p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Basic Information
                </h2>

                {/* Profile Photo Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {profilePhoto ? (
                      <div className="relative">
                        <img 
                          src={profilePhoto} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                        <Upload size={32} className="text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employee Code */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Employee Code
                    </label>
                    <input
                      type="text"
                      name="employee_code"
                      value={formData.employee_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                      placeholder="EMP001"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                      placeholder="Doe"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gender
                    </label>
                    <div className="flex gap-4">
                      {['Male', 'Female', 'Other'].map((gender) => (
                        <label key={gender} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={gender}
                            checked={formData.gender === gender}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {gender}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Address Information
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {/* Address */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Street Address
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-gray-400" />
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white resize-none"
                        placeholder="123 Main Street, Apt 4B"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="New York"
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        State/Province
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="New York"
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="India"
                      />
                    </div>

                    {/* Postal Code */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Emergency Contact
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emergency Contact Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="Jane Doe"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="emergency_contact_phone"
                        value={formData.emergency_contact_phone}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 dark:text-purple-400 hover:underline font-semibold">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 dark:text-purple-400 hover:underline font-semibold">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 group"
                >
                  Next
                  <ArrowRight 
                    size={18} 
                    className="group-hover:translate-x-1 transition-transform duration-200" 
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 group"
                >
                  Create Account
                  <ArrowRight 
                    size={18} 
                    className="group-hover:translate-x-1 transition-transform duration-200" 
                  />
                </button>
              )}
            </div>

            {/* Sign In Link */}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <a 
                href="#" 
                className="text-blue-600 dark:text-purple-400 hover:underline font-semibold"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}