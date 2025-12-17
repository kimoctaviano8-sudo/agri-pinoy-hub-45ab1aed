import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import { CartProvider } from "./contexts/CartContext";
import { OnboardingProvider, useOnboarding } from "./contexts/OnboardingContext";
import { useState } from "react";
import Navigation from "./components/Navigation";
import { FloatingNotifications } from "./components/FloatingNotifications";
import Onboarding from "./components/Onboarding";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Forum from "./pages/Forum";
import PlantScanner from "./pages/PlantScanner";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNewsForm from "./pages/AdminNewsForm";
import AdminProductForm from "./pages/AdminProductForm";
import NewsDetail from "./pages/NewsDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import EmailConfirmed from "./pages/EmailConfirmed";
import Inbox from "./pages/Inbox";
import MyPurchase from "./pages/MyPurchase";
import OrderSuccess from "./pages/OrderSuccess";
import HelpCentre from "./pages/HelpCentre";
import GeminiCares from "./pages/GeminiCares";
import { useLocationPermission } from "./hooks/useLocationPermission";
const queryClient = new QueryClient();

// Protected App Component that manages landing vs authenticated state
const ProtectedApp = () => {
  const {
    user,
    isLoading
  } = useAuth();
  const {
    hasCompletedOnboarding,
    completeOnboarding
  } = useOnboarding();
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();

  // Request location permission on app startup
  useLocationPermission();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-earth flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Gemini Updates</h2>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>;
  }

  // Show onboarding if authenticated but hasn't completed onboarding
  if (user && !hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  // Show main app if authenticated and onboarding completed
  if (user) {
    return <div className="min-h-screen bg-background">
        <Navigation notificationCount={notificationCount} setNotificationCount={setNotificationCount} />
        <FloatingNotifications onNotificationCountChange={setNotificationCount} />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/my-purchase" element={<MyPurchase />} />
            <Route path="/plant-scanner" element={<PlantScanner />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/help-centre" element={<HelpCentre />} />
            <Route path="/gemini-cares" element={<GeminiCares />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/news/:id" element={<AdminNewsForm />} />
            <Route path="/admin/products/:id" element={<AdminProductForm />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </div>;
  }

  // Show auth page if user clicked login/signup from landing
  if (showAuthPage) {
    return <Login initialMode={isLoginMode} onBack={() => setShowAuthPage(false)} />;
  }

  // Show landing page by default when not authenticated
  return <Landing onLogin={() => {
    setIsLoginMode(true);
    setShowAuthPage(true);
  }} onSignup={() => {
    setIsLoginMode(false);
    setShowAuthPage(true);
  }} />;
};
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TranslationProvider>
          <CartProvider>
            <OnboardingProvider>
              <Routes>
                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                <Route path="/*" element={<ProtectedApp />} />
              </Routes>
            </OnboardingProvider>
          </CartProvider>
        </TranslationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;