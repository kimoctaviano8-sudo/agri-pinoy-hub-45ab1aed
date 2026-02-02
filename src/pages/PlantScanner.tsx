import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, X, RotateCcw, Zap, Info, CreditCard, Coins, Download, FileText, Image, MessageCircle, Trophy, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RecommendedProducts from "@/components/RecommendedProducts";
import { DiagnosisHistory } from "@/components/DiagnosisHistory";
import { TechnicianContactDialog } from "@/components/TechnicianContactDialog";
import CommunityAlerts from "@/components/CommunityAlerts";
import SmartTreatmentScheduler from "@/components/SmartTreatmentScheduler";
import WeatherImpactAlerts from "@/components/WeatherImpactAlerts";
import SeasonalCareCalendar from "@/components/SeasonalCareCalendar";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import AchievementsModal from "@/components/AchievementsModal";
import { toast as sonnerToast } from "sonner";

interface DiseaseResult {
  disease: string;
  confidence: number;
}

const PlantScanner = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [results, setResults] = useState<DiseaseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [purchasingCredits, setPurchasingCredits] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ credits: number; price: number } | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showTechnicianDialog, setShowTechnicianDialog] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG, PNG, or WebP image.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResults([]);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const status = searchParams.get('status');
      const orderId = searchParams.get('order_id');
      
      if (!status || !orderId || !user) return;
      
      setSearchParams({});
      
      if (status === 'success') {
        setProcessingPayment(true);
        
        const { data: initialCredits } = await supabase
          .from('user_credits')
          .select('credits_remaining')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const startCredits = initialCredits?.credits_remaining ?? 0;
        
        let attempts = 0;
        const maxAttempts = 12;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const { data } = await supabase
            .from('user_credits')
            .select('credits_remaining')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const currentCredits = data?.credits_remaining ?? 0;
          
          if (currentCredits > startCredits) {
            setCredits(currentCredits);
            toast({
              title: "Payment Successful! 🎉",
              description: `${currentCredits - startCredits} credits added to your account.`,
            });
            setProcessingPayment(false);
            return;
          }
          
          attempts++;
        }
        
        setProcessingPayment(false);
        await fetchUserCredits();
        toast({
          title: "Payment Received",
          description: "Your credits are being processed and will appear shortly.",
        });
      } else if (status === 'failed' || status === 'cancelled') {
        toast({
          title: status === 'cancelled' ? "Payment Cancelled" : "Payment Failed",
          description: status === 'cancelled' 
            ? "You cancelled the payment. No charges were made."
            : "Payment could not be processed. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    checkPaymentStatus();
  }, [searchParams, user]);

  useEffect(() => {
    if (user) {
      fetchUserCredits();
      fetchUserPoints();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserPoints(data.total_points);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(hideTimer);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const fetchUserCredits = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('user_credits').select('credits_remaining').eq('user_id', user.id).maybeSingle();
      if (error) {
        console.error('Error fetching credits:', error);
        await supabase.rpc('initialize_user_credits', { user_id_param: user.id });
        setCredits(10);
        return;
      }
      setCredits(data?.credits_remaining || 10);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const trackAchievements = async (confidence: number) => {
    if (!user) return;

    try {
      const firstScan = await supabase.rpc('update_achievement_progress', {
        user_id_param: user.id,
        achievement_id_param: 'first_scan',
        progress_increment: 1
      });

      if (firstScan.data && typeof firstScan.data === 'object' && 'earned' in firstScan.data) {
        const achievementData = firstScan.data as { earned: boolean; points_awarded: number };
        if (achievementData.earned) {
          sonnerToast.success(`🏆 Achievement Unlocked! +${achievementData.points_awarded} points`, {
            description: "First Scan - You completed your first plant scan!"
          });
        }
      }

      const scan5 = await supabase.rpc('update_achievement_progress', {
        user_id_param: user.id,
        achievement_id_param: 'scan_5',
        progress_increment: 1
      });

      if (scan5.data && typeof scan5.data === 'object' && 'earned' in scan5.data) {
        const achievementData = scan5.data as { earned: boolean; points_awarded: number };
        if (achievementData.earned) {
          sonnerToast.success(`🏆 Achievement Unlocked! +${achievementData.points_awarded} points`, {
            description: "Scanner Novice - You completed 5 plant scans!"
          });
        }
      }

      await supabase.rpc('update_achievement_progress', {
        user_id_param: user.id,
        achievement_id_param: 'scan_25',
        progress_increment: 1
      });

      await supabase.rpc('update_achievement_progress', {
        user_id_param: user.id,
        achievement_id_param: 'scan_100',
        progress_increment: 1
      });

      if (confidence >= 95) {
        const perfectDiag = await supabase.rpc('update_achievement_progress', {
          user_id_param: user.id,
          achievement_id_param: 'perfect_diagnosis',
          progress_increment: 1
        });

        if (perfectDiag.data && typeof perfectDiag.data === 'object' && 'earned' in perfectDiag.data) {
          const achievementData = perfectDiag.data as { earned: boolean; points_awarded: number };
          if (achievementData.earned) {
            sonnerToast.success(`🏆 Achievement Unlocked! +${achievementData.points_awarded} points`, {
              description: "Perfect Diagnosis - You got a 95%+ confidence scan!"
            });
          }
        }
      }

      await fetchUserPoints();
    } catch (error) {
      console.error('Error tracking achievements:', error);
    }
  };

  const saveScanToHistory = async (result: DiseaseResult, imageBase64: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('plant_scan_history').insert({
        user_id: user.id,
        image_url: imageBase64,
        disease_detected: result.disease,
        confidence_score: result.confidence / 100,
        recommendations: result.disease.toLowerCase().includes('blight') 
          ? 'Remove infected leaves immediately, improve air circulation, avoid overhead watering, and apply copper-based fungicides.' 
          : result.disease.toLowerCase().includes('spot') 
          ? 'Prune affected areas, ensure proper plant spacing, water at soil level, and apply preventive fungicide treatments.' 
          : result.disease.toLowerCase().includes('rust') 
          ? 'Remove infected plant parts, avoid watering leaves, improve drainage, and use resistant plant varieties when possible.' 
          : 'Implement proper crop rotation, maintain soil health, ensure adequate spacing between plants, and monitor regularly for early detection.'
      });
      if (error) {
        console.error('Error saving scan history:', error);
      }
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        URL.revokeObjectURL(img.src);
        resolve(compressedBase64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const analyzePlant = async () => {
    if (!selectedImage || !user) return;

    const { data: creditData } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const currentCredits = creditData?.credits_remaining ?? 0;
    setCredits(currentCredits);

    if (currentCredits <= 0) {
      setShowCreditDialog(true);
      toast({
        title: "No Credits Available",
        description: "Please purchase credits to continue scanning.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    if ('vibrate' in navigator) {
      navigator.vibrate([50]);
    }

    try {
      const [compressedImage, sessionResult] = await Promise.all([
        compressImage(selectedImage, 800, 0.7),
        supabase.auth.getSession()
      ]);

      if (!sessionResult.data.session?.access_token) {
        throw new Error('Please log in to use the scanner');
      }

      const response = await supabase.functions.invoke('plant-disease-analyzer', {
        body: { image: compressedImage },
        headers: {
          Authorization: `Bearer ${sessionResult.data.session.access_token}`
        }
      });

      if (response.error) {
        const isCreditsError = 
          response.error.message?.includes('Insufficient credits') || 
          response.error.message?.includes('creditsRequired') ||
          response.error.message?.includes('no remaining scan credits');
        
        if (isCreditsError) {
          setShowCreditDialog(true);
          toast({
            title: "Insufficient Credits",
            description: "You need more credits to scan. Please purchase credits to continue.",
            variant: "destructive"
          });
          return;
        }
        
        throw new Error(response.error.message || 'Analysis failed');
      }
      
      const data = response.data;

      if (!data || !data.disease) {
        throw new Error('Invalid response from analysis service');
      }

      setCredits(prev => Math.max(0, prev - 1));

      const confidenceValue = typeof data.confidence === 'number' 
        ? data.confidence 
        : parseFloat(data.confidence) || 0;
      
      const formattedResults = [{
        disease: data.disease || 'Unknown',
        confidence: confidenceValue > 1 ? confidenceValue : confidenceValue * 100
      }];
      setResults(formattedResults);

      Promise.all([
        trackAchievements(confidenceValue),
        saveScanToHistory(formattedResults[0], compressedImage)
      ]).catch(console.error);
      
      toast({
        title: "Analysis Complete",
        description: `Found: ${formattedResults[0].disease}. ${credits - 1} credits remaining.`
      });

      if (formattedResults[0].disease.toLowerCase() !== 'healthy crop') {
        setTimeout(() => setShowTechnicianDialog(true), 2000);
      }
    } catch (error: any) {
      console.error('Error analyzing plant:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze plant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async (paymentMethod: string) => {
    if (!user || !selectedPackage) return;
    setPurchasingCredits(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('Authentication required');
      }

      const orderId = `CREDITS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const redirectUrl = window.location.origin + '/plant-scanner';

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: selectedPackage.price,
          paymentMethod: paymentMethod,
          orderId: orderId,
          description: `${selectedPackage.credits} Scan Credits`,
          redirectUrl: redirectUrl,
          credits: selectedPackage.credits,
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.clientKey) {
        toast({
          title: "Card Payment",
          description: "Card payment integration requires additional setup. Please try another payment method.",
          variant: "destructive"
        });
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPurchasingCredits(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    setResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 80) return "bg-success";
    if (confidence >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const downloadAsPDF = async () => {
    if (!results.length || !selectedImage) return;
    try {
      const result = results[0];
      const timestamp = new Date().toLocaleString();
      const pdf = new jsPDF();

      pdf.setFontSize(20);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Plant Disease Analysis Report', 20, 25);

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date & Time: ${timestamp}`, 20, 40);
      pdf.text(`Image: ${selectedImage.name}`, 20, 50);

      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Analysis Results', 20, 70);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Disease Detected: ${result.disease}`, 20, 85);
      pdf.text(`Confidence Score: ${result.confidence.toFixed(1)}%`, 20, 95);
      pdf.text(`Confidence Level: ${result.confidence >= 80 ? 'High' : result.confidence >= 60 ? 'Medium' : 'Low'}`, 20, 105);

      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Treatment Recommendations', 20, 125);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const treatmentText = result.disease.toLowerCase().includes('blight') 
        ? 'Remove infected leaves immediately, improve air circulation, avoid overhead watering, and apply copper-based fungicides.' 
        : result.disease.toLowerCase().includes('spot') 
        ? 'Prune affected areas, ensure proper plant spacing, water at soil level, and apply preventive fungicide treatments.' 
        : result.disease.toLowerCase().includes('rust') 
        ? 'Remove infected plant parts, avoid watering leaves, improve drainage, and use resistant plant varieties when possible.' 
        : 'Implement proper crop rotation, maintain soil health, ensure adequate spacing between plants, and monitor regularly for early detection.';
      const splitText = pdf.splitTextToSize(treatmentText, 170);
      pdf.text(splitText, 20, 140);

      const appGuideText = 'Apply recommended fungicides during early morning or late evening to avoid leaf burn. Spray thoroughly covering both upper and lower leaf surfaces. Always wear protective equipment and follow label instructions for dilution rates.';
      const splitAppGuide = pdf.splitTextToSize(appGuideText, 170);
      pdf.text(splitAppGuide, 20, 165);

      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by Plant Disease Scanner', 20, 280);
      pdf.save(`plant-analysis-${Date.now()}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Analysis report has been saved as PDF."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadAsJPEG = async () => {
    if (!results.length || !selectedImage || !resultsRef.current) return;
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `plant-analysis-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      toast({
        title: "JPEG Downloaded",
        description: "Analysis report has been saved as image."
      });
    } catch (error) {
      console.error('Error generating JPEG:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Minimal Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Plant Scanner</h1>
              <p className="text-xs text-muted-foreground">AI-powered disease detection</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => setShowAchievementsModal(true)}
                className="h-8 px-2"
              >
                <Trophy className="w-4 h-4 text-primary" />
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => setShowCreditDialog(true)}
                className="h-8 px-3 text-xs font-medium"
              >
                <Coins className="w-3.5 h-3.5 mr-1 text-primary" />
                {credits}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Scanner Card */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
                <TabsTrigger value="camera" className="text-sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="mt-0">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                
                {!previewUrl ? (
                  <button 
                    onClick={handleCameraCapture} 
                    className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Capture Plant Image</p>
                      <p className="text-xs text-muted-foreground mt-1">Point camera at affected area</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative">
                    <img src={previewUrl} alt="Captured plant" className="w-full h-48 object-cover rounded-xl" />
                    <ScanningAnimation isScanning={loading} />
                    <Button 
                      onClick={resetScanner} 
                      size="sm" 
                      variant="secondary" 
                      className="absolute top-2 right-2 h-8 px-3 bg-background/90 hover:bg-background"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="upload" className="mt-0">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                
                {!previewUrl ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Upload Plant Image</p>
                      <p className="text-xs text-muted-foreground mt-1">Choose from your gallery</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative">
                    <img src={previewUrl} alt="Uploaded plant" className="w-full h-48 object-cover rounded-xl" />
                    <ScanningAnimation isScanning={loading} />
                    <Button 
                      onClick={resetScanner} 
                      size="sm" 
                      variant="secondary" 
                      className="absolute top-2 right-2 h-8 px-3 bg-background/90 hover:bg-background"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Analyze Button */}
            {selectedImage && !loading && results.length === 0 && (
              <Button 
                onClick={analyzePlant} 
                className="w-full mt-4 h-12 bg-primary hover:bg-primary/90"
              >
                <Zap className="w-5 h-5 mr-2" />
                Analyze Plant
              </Button>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">Analyzing...</p>
                <p className="text-xs text-muted-foreground mt-1">AI is scanning your plant</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" ref={resultsRef}>
              {results.map((result, index) => (
                <div key={index} className="space-y-4">
                  {/* Result Card */}
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{result.disease}</h3>
                      <Badge variant="secondary" className={`${getConfidenceColor(result.confidence)} font-medium`}>
                        {result.confidence.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`${getConfidenceBgColor(result.confidence)} h-2 rounded-full transition-all duration-500`} 
                        style={{ width: `${result.confidence}%` }} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {result.confidence >= 80 ? 'High' : result.confidence >= 60 ? 'Medium' : 'Low'}
                    </p>
                  </div>

                  {/* Treatment Info */}
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        How to Solve
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {result.disease.toLowerCase().includes('blight') 
                          ? 'Remove infected leaves immediately, improve air circulation, avoid overhead watering, and apply copper-based fungicides.' 
                          : result.disease.toLowerCase().includes('spot') 
                          ? 'Prune affected areas, ensure proper plant spacing, water at soil level, and apply preventive fungicide treatments.' 
                          : result.disease.toLowerCase().includes('rust') 
                          ? 'Remove infected plant parts, avoid watering leaves, improve drainage, and use resistant plant varieties when possible.' 
                          : 'Implement proper crop rotation, maintain soil health, ensure adequate spacing between plants, and monitor regularly for early detection.'}
                      </p>
                    </div>

                    <div className="p-4 bg-success/5 rounded-xl border border-success/10">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                        Application Guide
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Apply recommended fungicides during early morning or late evening. Spray thoroughly covering both leaf surfaces. Wear protective equipment and follow label instructions.
                      </p>
                    </div>

                    <div className="p-4 bg-warning/5 rounded-xl border border-warning/10">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                        Treatment Duration
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium">Initial:</span> Every 7-10 days for 3-4 weeks. <span className="font-medium">Maintenance:</span> Bi-weekly during favorable conditions.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDownloadDialog(true)}
                  className="h-10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline"
                  onClick={resetScanner}
                  className="h-10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather-Integrated Treatment Advisor */}
        {results.length > 0 && (
          <>
            <SmartTreatmentScheduler disease={results[0].disease} />
            <WeatherImpactAlerts disease={results[0].disease} />
          </>
        )}

        {/* Seasonal Care Calendar */}
        <SeasonalCareCalendar />

        {/* Recommended Products */}
        {results.length > 0 && <RecommendedProducts disease={results[0].disease} confidence={results[0].confidence} />}

        {/* Community Alerts */}
        {user && (
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <CommunityAlerts />
            </CardContent>
          </Card>
        )}

        {/* Diagnosis History */}
        {user && <DiagnosisHistory />}

        {/* Info Section */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Supported Diseases</h3>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">Tomato:</span> Septoria, Bacterial Spot, Blight</p>
                  <p><span className="font-medium text-foreground">Corn:</span> Rust, Grey Leaf Spot, Northern Blight</p>
                  <p><span className="font-medium text-foreground">Soy:</span> Frogeye Leaf Spot, Downy Mildew</p>
                  <p><span className="font-medium text-foreground">Cabbage:</span> Black Rot</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Purchase Drawer */}
      <Drawer open={showCreditDialog} onOpenChange={(open) => {
        setShowCreditDialog(open);
        if (!open) setSelectedPackage(null);
      }}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="px-4 pb-2">
            <DrawerTitle className="text-lg font-semibold text-primary">
              {selectedPackage ? 'Complete Payment' : 'Purchase Credits'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[60vh] scrollbar-hide space-y-4">
            {!selectedPackage ? (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                  </div>
                  <span className="text-lg font-bold text-primary">{credits}</span>
                </div>
                
                {credits <= 20 && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl">
                    <p className="text-warning text-xs font-medium">
                      ⚠️ Credits running low. Purchase more to continue.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {[
                    { credits: 100, price: 299, popular: false },
                    { credits: 200, price: 499, popular: true },
                    { credits: 300, price: 699, popular: false },
                    { credits: 500, price: 999, popular: false },
                  ].map((pkg) => (
                    <button 
                      key={pkg.credits} 
                      onClick={() => setSelectedPackage({ credits: pkg.credits, price: pkg.price })} 
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] ${
                        pkg.popular
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-semibold">{pkg.credits} Credits</p>
                          {pkg.popular && <span className="text-xs opacity-80">Most Popular</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₱{pkg.price}</p>
                        <p className="text-xs opacity-70">₱{(pkg.price / pkg.credits).toFixed(2)}/scan</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedPackage(null)}
                  className="mb-2 -ml-2 h-8"
                  disabled={purchasingCredits}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedPackage.credits} Credits</p>
                        <p className="text-xs text-muted-foreground">₱{(selectedPackage.price / selectedPackage.credits).toFixed(2)} per scan</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-primary">₱{selectedPackage.price}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground mb-2">Select Payment Method</p>
                  
                  {[
                    { id: 'qrph', name: 'QRPh', desc: 'InstaPay/PESONet' },
                    { id: 'gcash', name: 'GCash', desc: 'Pay with GCash' },
                    { id: 'maya', name: 'Maya', desc: 'Pay with Maya' },
                    { id: 'card', name: 'Card', desc: 'Visa, Mastercard' },
                  ].map((method) => (
                    <Button
                      key={method.id}
                      onClick={() => purchaseCredits(method.id)}
                      disabled={purchasingCredits}
                      variant="outline"
                      className="w-full h-auto p-4 justify-between"
                    >
                      <div className="text-left">
                        <p className="font-medium">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                    </Button>
                  ))}
                </div>

                {purchasingCredits && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Download Format Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Download Format
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button 
              onClick={() => {
                downloadAsPDF();
                setShowDownloadDialog(false);
              }} 
              variant="outline"
              className="w-full justify-between h-12"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-destructive" />
                <span>PDF Document</span>
              </div>
            </Button>
            
            <Button 
              onClick={() => {
                downloadAsJPEG();
                setShowDownloadDialog(false);
              }} 
              variant="outline"
              className="w-full justify-between h-12"
            >
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                <span>JPEG Image</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technician Contact Dialog */}
      <TechnicianContactDialog open={showTechnicianDialog} onOpenChange={setShowTechnicianDialog} />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        currentPoints={userPoints}
      />

      {/* Floating Expert Button */}
      {!showAchievementsModal && (
        <TooltipProvider>
          <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setShowTechnicianDialog(true)} 
                className="fixed bottom-[12%] right-4 z-50 rounded-full w-12 h-12 shadow-elevated opacity-60 hover:opacity-100 bg-primary hover:bg-primary/90 transition-all hover:scale-105" 
                size="icon"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover border shadow-lg">
              <p className="text-sm">Need expert help?</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default PlantScanner;
