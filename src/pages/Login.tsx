import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CalendarIcon, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getCitiesList, getBarangaysByCity } from "@/data/philippineLocations";
import { getProvincesList, getCitiesByProvince } from "@/data/philippineProvinces";
import { SignupModal } from "@/components/ui/signup-modal";
import { useNativeBiometric } from "@/hooks/useNativeBiometric";
import { supabase } from "@/integrations/supabase/client";
import loginBg from "@/assets/login-section-acc.jpg";
import signupBg from "@/assets/auth-signup-bg.jpg";
interface Country {
  name: {
    common: string;
  };
  cca2: string;
}
interface State {
  name: string;
  iso2: string;
}
interface City {
  name: string;
}
interface LoginProps {
  initialMode?: boolean;
  onBack?: () => void;
}
const Login = ({
  initialMode = true,
  onBack
}: LoginProps) => {
  const [isLogin, setIsLogin] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    birthday: null as Date | null,
    phone: "",
    streetNumber: "",
    country: "",
    province: "",
    city: "",
    role: "farmer",
    gender: ""
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [availableBarangays, setAvailableBarangays] = useState<string[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const {
    toast
  } = useToast();
  const {
    login,
    register,
    isLoading
  } = useAuth();

  // Native biometric hook with enhanced error handling
  const {
    isAvailable: biometricSupported,
    isEnabled: biometricEnabled,
    isChecking: biometricChecking,
    isNative,
    error: biometricError,
    getBiometryTypeName,
    authenticate: nativeAuthenticate,
    getCredentials,
    setCredentials,
    clearError
  } = useNativeBiometric();

  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  // Fetch countries when in signup mode
  useEffect(() => {
    if (!isLogin) {
      fetchCountries();
    }
  }, [isLogin]);

  // Biometric authentication function with improved UX
  const handleBiometricAuth = async () => {
    // Clear any previous errors
    clearError();
    
    // Check if device supports biometrics
    if (!biometricSupported) {
      toast({
        title: "Not Supported",
        description: "Face ID/Fingerprint is not available on this device. Please use email login.",
        variant: "destructive"
      });
      return;
    }

    // Check if biometric login is set up
    if (!biometricEnabled) {
      toast({
        title: "Setup Required",
        description: "Please log in with email first to enable biometric login.",
        variant: "destructive"
      });
      return;
    }

    setIsBiometricLoading(true);

    try {
      // Authenticate with biometrics
      const authenticated = await nativeAuthenticate('Verify your identity to log in');
      
      if (!authenticated) {
        setIsBiometricLoading(false);
        toast({
          title: "Authentication Cancelled",
          description: "Biometric verification was cancelled or failed.",
          variant: "destructive"
        });
        return;
      }

      // Get stored credentials after successful biometric verification
      const credentials = await getCredentials();
      
      if (!credentials || !credentials.username || !credentials.password) {
        setIsBiometricLoading(false);
        toast({
          title: "Credentials Not Found",
          description: "Please log in with email and password to re-enable biometric login.",
          variant: "destructive"
        });
        return;
      }

      // Show success feedback
      toast({
        title: "Verified",
        description: "Logging you in..."
      });

      // Login with stored credentials
      const success = await login(credentials.username, credentials.password);
      
      setIsBiometricLoading(false);
      
      if (!success) {
        toast({
          title: "Login Failed",
          description: "Your session may have expired. Please log in with email and password.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setIsBiometricLoading(false);
      toast({
        title: "Authentication Error",
        description: "Something went wrong. Please try again or use email login.",
        variant: "destructive"
      });
    }
  };

  // Store credentials for biometric login after successful email/password login
  const handleLoginWithCredentialStorage = async (email: string, password: string): Promise<boolean> => {
    const success = await login(email, password);
    
    if (success && biometricSupported) {
      // Store credentials for biometric login
      await setCredentials(email, password);
    }
    
    return success;
  };
  const fetchCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      const data = await response.json();
      setCountries(data.sort((a: Country, b: Country) => a.name.common.localeCompare(b.name.common)));
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };
  const fetchStates = async (countryCode: string) => {
    try {
      setIsLoadingLocation(true);

      // Use local data for Philippines
      if (countryCode === 'PH') {
        const philippinesStates = getProvincesList().map((province, index) => ({
          name: province,
          iso2: `PH-${index.toString().padStart(2, '0')}`
        }));
        setProvinces(philippinesStates);
      } else {
        // Use Supabase Edge Function proxy for other countries
        const {
          data,
          error
        } = await supabase.functions.invoke<State[]>('csc-location', {
          body: {
            type: 'states',
            countryCode
          }
        });
        if (error) throw error;
        setProvinces((data || []).sort((a, b) => a.name.localeCompare(b.name)));
      }
      setCities([]);
      setAvailableBarangays([]);
    } catch (error) {
      console.error('Error fetching states:', error);
      setProvinces([]);
    } finally {
      setIsLoadingLocation(false);
    }
  };
  const fetchCities = async (countryCode: string, stateCode: string) => {
    try {
      setIsLoadingLocation(true);

      // For Philippines, we don't need to fetch cities from API since we use local data
      if (countryCode === 'PH') {
        setCities([]);
      } else {
        // Use Supabase Edge Function proxy for other countries
        const {
          data,
          error
        } = await supabase.functions.invoke<City[]>('csc-location', {
          body: {
            type: 'cities',
            countryCode,
            stateCode
          }
        });
        if (error) throw error;
        setCities((data || []).sort((a, b) => a.name.localeCompare(b.name)));
      }
      setAvailableBarangays([]);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setIsLoadingLocation(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (value.trim()) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }

    // Handle location cascading
    if (name === 'country') {
      const selectedCountry = countries.find(c => c.name.common === value);
      if (selectedCountry) {
        fetchStates(selectedCountry.cca2);
        setFormData(prev => ({
          ...prev,
          country: value,
          province: "",
          city: ""
        }));
      }
    } else if (name === 'province') {
      const selectedCountry = countries.find(c => c.name.common === formData.country);
      const selectedProvince = provinces.find(p => p.name === value);
      if (selectedCountry && selectedProvince && formData.country !== 'Philippines') {
        fetchCities(selectedCountry.cca2, selectedProvince.iso2);
      }
      setFormData(prev => ({
        ...prev,
        province: value,
        city: ""
      }));
    } else if (name === 'city') {
      // For Philippines, use local barangay data
      if (formData.country === 'Philippines') {
        const barangays = getBarangaysByCity(value);
        setAvailableBarangays(barangays);
      }
      setFormData(prev => ({
        ...prev,
        city: value
      }));
    }
  };
  const handleDateChange = (date: Date | undefined) => {
    setFormData({
      ...formData,
      birthday: date || null
    });
    setTouched(prev => ({ ...prev, birthday: true }));
    if (date) {
      setFieldErrors(prev => { const n = { ...prev }; delete n.birthday; return n; });
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const value = (formData as any)[field];
    const errors: Record<string, string> = {};
    if (field === 'birthday') {
      if (!formData.birthday) errors.birthday = 'This field is required';
    } else if (typeof value === 'string' && !value.trim()) {
      errors[field] = 'This field is required';
    }
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.email = 'Please enter a valid email';
    }
    if (field === 'password' && value && value.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (field === 'confirmPassword' && value && value !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(prev => {
      const next = { ...prev };
      if (Object.keys(errors).length > 0) {
        Object.assign(next, errors);
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const validateAllFields = (): boolean => {
    const requiredFields = isLogin
      ? ['email', 'password']
      : ['firstName', 'lastName', 'birthday', 'gender', 'phone', 'streetNumber', 'country', 'province', 'city', 'email', 'password', 'confirmPassword'];
    
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    
    for (const field of requiredFields) {
      allTouched[field] = true;
      if (field === 'birthday') {
        if (!formData.birthday) errors.birthday = 'This field is required';
      } else {
        const value = (formData as any)[field];
        if (typeof value !== 'string' || !value.trim()) errors[field] = 'This field is required';
      }
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!isLogin && formData.confirmPassword && formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setTouched(prev => ({ ...prev, ...allTouched }));
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAllFields()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    try {
      if (isLogin) {
        // Use the credential-storing login handler
        const success = await handleLoginWithCredentialStorage(formData.email, formData.password);
        if (success) {
          toast({
            title: "Login Successful",
            description: "Welcome back!"
          });
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive"
          });
        }
      } else {

        // Show the modal and start the signup process
        setShowSignupModal(true);
        setIsSignupLoading(true);
        setSignupSuccess(false);
        const success = await register({
          ...formData,
          barangay: "",
          gender: formData.gender
        });
        setIsSignupLoading(false);
        if (success) {
          setSignupSuccess(true);
          // Keep modal open to show email verification message
        } else {
          setShowSignupModal(false);
          toast({
            title: "Registration Failed",
            description: "Please check your information and try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      setIsSignupLoading(false);
      setShowSignupModal(false);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  const roles = [{
    value: "farmer",
    label: "Farmer"
  }, {
    value: "agri-entrepreneur",
    label: "Agri-Entrepreneur"
  }, {
    value: "field-agent",
    label: "Field Agent"
  }, {
    value: "researcher",
    label: "Researcher"
  }];
  const FieldError = ({ field }: { field: string }) => 
    touched[field] && fieldErrors[field] ? (
      <p className="text-xs text-destructive mt-1">{fieldErrors[field]}</p>
    ) : null;

  const errClass = (field: string) => 
    touched[field] && fieldErrors[field] ? 'border-destructive' : 'border-border';

  return <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
    backgroundImage: `url(${isLogin ? loginBg : signupBg})`
  }}>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-8 relative z-10">
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-white font-medium">
          {isLogin ? "Sign Up" : "Log In"}
        </span>
      </div>

      {/* Title */}
      <div className="px-6 pb-8 relative z-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isLogin ? "Log In" : "Sign Up"}
        </h1>
      </div>

      {/* Form Container */}
      <div className="flex-1 bg-background rounded-t-3xl min-h-[calc(100vh-160px)] px-6 pt-6 pb-8 relative z-10 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
          {!isLogin && <>
              {/* First Name and Last Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-medium text-foreground">
                    First Name
                  </Label>
                  <Input id="firstName" name="firstName" type="text" placeholder="First name" value={formData.firstName} onChange={handleInputChange} onBlur={() => handleBlur('firstName')} className={`h-12 text-sm bg-background border ${errClass('firstName')} rounded-xl focus:border-primary`} />
                  <FieldError field="firstName" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-medium text-foreground">
                    Last Name
                  </Label>
                  <Input id="lastName" name="lastName" type="text" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} onBlur={() => handleBlur('lastName')} className={`h-12 text-sm bg-background border ${errClass('lastName')} rounded-xl focus:border-primary`} />
                  <FieldError field="lastName" />
                </div>
              </div>

              {/* Birthday Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Birthday</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(`h-12 w-full text-sm bg-background border ${errClass('birthday')} rounded-xl justify-start text-left font-normal focus:border-primary`, !formData.birthday && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthday ? format(formData.birthday, "MMM dd, yyyy") : <span>Select birthday</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.birthday || undefined} onSelect={handleDateChange} disabled={date => date > new Date() || date < new Date("1900-01-01")} captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FieldError field="birthday" />
              </div>

              {/* Gender Field */}
              <div className="space-y-1">
                <Label htmlFor="gender" className="text-xs font-medium text-foreground">Gender</Label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} onBlur={() => handleBlur('gender')} className={`w-full h-12 text-sm bg-background border ${errClass('gender')} rounded-xl px-3 text-foreground focus:outline-none focus:border-primary`}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <FieldError field="gender" />
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                  Phone Number
                </Label>
                <Input id="phone" name="phone" type="tel" placeholder="+63 XXX XXX XXXX" value={formData.phone} onChange={handleInputChange} onBlur={() => handleBlur('phone')} className={`h-12 text-sm bg-background border ${errClass('phone')} rounded-xl focus:border-primary`} />
                <FieldError field="phone" />
              </div>

              {/* Location Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1">Location Details</h3>
                
                {/* Street Number */}
                <div className="space-y-1">
                  <Label htmlFor="streetNumber" className="text-xs font-medium text-foreground">
                    House/Street Number
                  </Label>
                  <Input id="streetNumber" name="streetNumber" type="text" placeholder="e.g., 123, Blk 4 Lot 5" value={formData.streetNumber} onChange={handleInputChange} onBlur={() => handleBlur('streetNumber')} className={`h-12 text-sm bg-background border ${errClass('streetNumber')} rounded-xl focus:border-primary`} />
                  <FieldError field="streetNumber" />
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-xs font-medium text-foreground">
                    Country
                  </Label>
                  <select id="country" name="country" value={formData.country} onChange={handleInputChange} onBlur={() => handleBlur('country')} className={`w-full h-12 text-sm bg-background border ${errClass('country')} rounded-xl px-3 text-foreground focus:outline-none focus:border-primary`}>
                    <option value="">Select your country</option>
                    {countries.map(country => <option key={country.cca2} value={country.name.common}>
                        {country.name.common}
                      </option>)}
                  </select>
                  <FieldError field="country" />
                </div>

                {/* Province/State */}
                <div className="space-y-1">
                  <Label htmlFor="province" className="text-xs font-medium text-foreground">
                    Province/State
                  </Label>
                  <select id="province" name="province" value={formData.province} onChange={handleInputChange} onBlur={() => handleBlur('province')} className={`w-full h-12 text-sm bg-background border ${errClass('province')} rounded-xl px-3 text-foreground focus:outline-none focus:border-primary disabled:opacity-50`} disabled={!formData.country || isLoadingLocation}>
                    <option value="">
                      {!formData.country ? "Select country first" : isLoadingLocation ? "Loading..." : "Select province/state"}
                    </option>
                    {provinces.map(province => <option key={province.iso2} value={province.name}>
                        {province.name}
                      </option>)}
                  </select>
                  <FieldError field="province" />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs font-medium text-foreground">
                    City
                  </Label>
                  <select id="city" name="city" value={formData.city} onChange={handleInputChange} onBlur={() => handleBlur('city')} className={`w-full h-12 text-sm bg-background border ${errClass('city')} rounded-xl px-3 text-foreground focus:outline-none focus:border-primary disabled:opacity-50`} disabled={!formData.province || isLoadingLocation}>
                    <option value="">
                      {!formData.province ? "Select province first" : isLoadingLocation ? "Loading..." : "Select city"}
                    </option>
                    {formData.country === 'Philippines' ? getCitiesByProvince(formData.province).map(city => <option key={city} value={city}>
                          {city}
                        </option>) : cities.map(city => <option key={city.name} value={city.name}>
                          {city.name}
                        </option>)}
                  </select>
                  <FieldError field="city" />
                </div>
              </div>

              {/* Role Field */}
              <div className="space-y-1 pt-2">
                <Label htmlFor="role" className="text-xs font-medium text-foreground">Your Role</Label>
                <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="w-full h-12 text-sm bg-background border border-border rounded-xl px-3 text-foreground focus:outline-none focus:border-primary" required>
                  {roles.map(role => <option key={role.value} value={role.value}>
                      {role.label}
                    </option>)}
                </select>
              </div>
            </>}

          {/* Email Field */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              {isLogin ? "Email/Username" : "Email Address"}
            </Label>
            <Input id="email" name="email" type="email" placeholder={isLogin ? "Enter email or username" : "Enter your email"} value={formData.email} onChange={handleInputChange} onBlur={() => handleBlur('email')} className={`h-12 text-sm bg-background border ${errClass('email')} rounded-xl focus:border-primary`} />
            <FieldError field="email" />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={formData.password} onChange={handleInputChange} onBlur={() => handleBlur('password')} className={`h-12 text-sm bg-background border ${errClass('password')} rounded-xl pr-10 focus:border-primary`} />
              <FieldError field="password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          {!isLogin && <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                Confirm Password
              </Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleInputChange} onBlur={() => handleBlur('confirmPassword')} className={`h-12 text-sm bg-background border ${errClass('confirmPassword')} rounded-xl focus:border-primary`} />
              <FieldError field="confirmPassword" />
            </div>}

          {/* Forgot Password */}
          {isLogin && <div className="text-right pt-1">
              <Button variant="link" className="text-xs p-0 h-auto text-muted-foreground hover:text-primary">
                Forgot password?
              </Button>
            </div>}

          {/* Submit Button */}
          <Button type="submit" className="w-full h-12 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl mt-6" disabled={isLoading}>
            {isLoading ? "Creating Account..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          {/* Biometric Authentication Button - Only show for login */}
          {isLogin && <>
              <div className="relative my-6">
                <Separator className="bg-border" />
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-4">
                  <span className="text-xs text-muted-foreground">or</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBiometricAuth}
                disabled={!biometricSupported || biometricChecking || isBiometricLoading}
                className={`w-full h-12 text-sm border-2 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                  biometricSupported 
                    ? 'border-primary/50 hover:bg-primary/10 hover:border-primary active:scale-[0.98]' 
                    : 'border-border disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isBiometricLoading || biometricChecking ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Fingerprint className={`w-5 h-5 ${biometricSupported ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
                <span className={biometricSupported ? 'text-foreground' : 'text-muted-foreground'}>
                  {isBiometricLoading 
                    ? 'Verifying...' 
                    : biometricChecking 
                      ? 'Checking...' 
                      : biometricEnabled 
                        ? 'Use Face ID/Fingerprint' 
                        : 'Face ID/Fingerprint (Setup Required)'}
                </span>
              </Button>
            </>}

          {/* Switch Mode */}
          <div className="text-center mt-8 pt-4">
            <span className="text-muted-foreground text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Button type="button" variant="link" className="text-sm p-0 h-auto text-primary hover:text-primary/80 font-semibold" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Sign Up" : "Log In"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Signup Modal */}
      <SignupModal open={showSignupModal} onOpenChange={setShowSignupModal} isLoading={isSignupLoading} isSuccess={signupSuccess} email={formData.email} />
    </div>;
};
export default Login;