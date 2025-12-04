import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, X, RotateCcw, Zap, Info, CreditCard, Coins, Download, FileText, Image, MessageCircle, Trophy } from "lucide-react";
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
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showTechnicianDialog, setShowTechnicianDialog] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file type
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

  // Fetch user credits and points on component mount
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

  // Auto-show tooltip for floating button
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
      // Auto-hide after 3 seconds
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(hideTimer);
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, []);
  const fetchUserCredits = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('user_credits').select('credits_remaining').eq('user_id', user.id).maybeSingle();
      if (error) {
        console.error('Error fetching credits:', error);
        // Initialize credits if user doesn't have a record
        await supabase.rpc('initialize_user_credits', {
          user_id_param: user.id
        });
        setCredits(10); // Default credits
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
      // Track first scan achievement
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

      // Track scan count achievements
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

      // Track perfect diagnosis if confidence is high
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

      // Refresh points
      await fetchUserPoints();
    } catch (error) {
      console.error('Error tracking achievements:', error);
    }
  };

  const saveScanToHistory = async (result: DiseaseResult, imageBase64: string) => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('plant_scan_history').insert({
        user_id: user.id,
        image_url: imageBase64,
        disease_detected: result.disease,
        confidence_score: result.confidence / 100,
        recommendations: result.disease.toLowerCase().includes('blight') ? 'Remove infected leaves immediately, improve air circulation, avoid overhead watering, and apply copper-based fungicides.' : result.disease.toLowerCase().includes('spot') ? 'Prune affected areas, ensure proper plant spacing, water at soil level, and apply preventive fungicide treatments.' : result.disease.toLowerCase().includes('rust') ? 'Remove infected plant parts, avoid watering leaves, improve drainage, and use resistant plant varieties when possible.' : 'Implement proper crop rotation, maintain soil health, ensure adequate spacing between plants, and monitor regularly for early detection.'
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
  const analyzePlant = async () => {
    if (!selectedImage || !user) return;

    // Check if user has credits
    if (credits <= 0) {
      setShowCreditDialog(true);
      return;
    }
    
    setLoading(true);
    
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Increase timeout to 90 seconds for Gemini Vision AI
    const analysisTimeout = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Analysis Taking Longer",
        description: "The AI is still processing your image. Please wait...",
        variant: "default"
      });
    }, 60000); // 60 second soft timeout (won't stop the request)

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;

          // Get session token
          const session = await supabase.auth.getSession();
          if (!session.data.session?.access_token) {
            clearTimeout(analysisTimeout);
            throw new Error('Please log in to use the scanner');
          }

          // Call our edge function with credit checking
          const response = await supabase.functions.invoke('plant-disease-analyzer', {
            body: { image: base64Image },
            headers: {
              Authorization: `Bearer ${session.data.session.access_token}`
            }
          });
          
          clearTimeout(analysisTimeout);
          
          // Check if it's a 402 status (insufficient credits)
          if (response.error) {
            console.error('Edge function error:', response.error);
            
            // Check for credit errors - handle both 402 status and error message
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

          // Update credits after successful scan
          setCredits(prev => Math.max(0, prev - 1));

          // Format results with proper confidence calculation
          const confidenceValue = typeof data.confidence === 'number' 
            ? data.confidence 
            : parseFloat(data.confidence) || 0;
          
          const formattedResults = [{
            disease: data.disease || 'Unknown',
            confidence: confidenceValue > 1 ? confidenceValue : confidenceValue * 100
          }];
          setResults(formattedResults);

          // Track achievements
          await trackAchievements(confidenceValue);

          // Save scan result to history with full analysis data
          await saveScanToHistory(formattedResults[0], base64Image);
          
          toast({
            title: "Analysis Complete",
            description: `Found: ${formattedResults[0].disease}. ${credits - 1} credits remaining.`
          });

          // Show technician contact dialog for disease detection
          if (formattedResults[0].disease.toLowerCase() !== 'healthy crop') {
            setTimeout(() => {
              setShowTechnicianDialog(true);
            }, 2000);
          }
        } catch (error: any) {
          clearTimeout(analysisTimeout);
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
      
      reader.onerror = () => {
        clearTimeout(analysisTimeout);
        toast({
          title: "Image Read Failed",
          description: "Failed to read the image file. Please try another image.",
          variant: "destructive"
        });
        setLoading(false);
      };
    } catch (error: any) {
      clearTimeout(analysisTimeout);
      console.error('Error analyzing plant:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze plant. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };
  const purchaseCredits = async (packageType: string) => {
    if (!user) return;
    setPurchasingCredits(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('Authentication required');
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('purchase-credits', {
        body: {
          creditPackage: packageType
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });
      if (error) throw error;

      // Refresh credits
      await fetchUserCredits();
      setShowCreditDialog(false);
      toast({
        title: "Credits Purchased!",
        description: data.message
      });
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase credits. Please try again.",
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  const downloadAsPDF = async () => {
    if (!results.length || !selectedImage) return;
    try {
      const result = results[0];
      const timestamp = new Date().toLocaleString();
      const pdf = new jsPDF();

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(34, 197, 94); // Green color
      pdf.text('Plant Disease Analysis Report', 20, 25);

      // Add timestamp
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date & Time: ${timestamp}`, 20, 40);
      pdf.text(`Image: ${selectedImage.name}`, 20, 50);

      // Add results section
      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Analysis Results', 20, 70);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Disease Detected: ${result.disease}`, 20, 85);
      pdf.text(`Confidence Score: ${result.confidence.toFixed(1)}%`, 20, 95);
      pdf.text(`Confidence Level: ${result.confidence >= 80 ? 'High' : result.confidence >= 60 ? 'Medium' : 'Low'}`, 20, 105);

      // Add treatment information
      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Treatment Recommendations', 20, 125);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const treatmentText = result.disease.toLowerCase().includes('blight') ? 'Remove infected leaves immediately, improve air circulation, avoid overhead watering, and apply copper-based fungicides.' : result.disease.toLowerCase().includes('spot') ? 'Prune affected areas, ensure proper plant spacing, water at soil level, and apply preventive fungicide treatments.' : result.disease.toLowerCase().includes('rust') ? 'Remove infected plant parts, avoid watering leaves, improve drainage, and use resistant plant varieties when possible.' : 'Implement proper crop rotation, maintain soil health, ensure adequate spacing between plants, and monitor regularly for early detection.';
      const splitText = pdf.splitTextToSize(treatmentText, 170);
      pdf.text(splitText, 20, 140);

      // Add application guide
      const appGuideText = 'Apply recommended fungicides during early morning or late evening to avoid leaf burn. Spray thoroughly covering both upper and lower leaf surfaces. Always wear protective equipment and follow label instructions for dilution rates.';
      const splitAppGuide = pdf.splitTextToSize(appGuideText, 170);
      pdf.text(splitAppGuide, 20, 165);

      // Add footer
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
  return <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-6 md:py-8">
        <div className="px-4 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Camera className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Plant Disease Scanner</h1>
          </div>
          <p className="text-white/90 text-xs md:text-sm">
            Capture or upload plant images for instant AI-powered disease analysis
          </p>
          
          {/* Credits Display & Achievements */}
          {user && <div className="flex items-center justify-center gap-2 mt-4">
              <Button 
                size="sm" 
                onClick={() => setShowAchievementsModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full px-4 py-2 shadow-md transition-all hover:scale-105"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Achievements
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowCreditDialog(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full px-4 py-2 shadow-md transition-all hover:scale-105"
              >
                <Coins className="w-4 h-4 mr-1" />
                {credits} Credits
              </Button>
            </div>}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 bg-background">
        {/* Image Input Section */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="space-y-4">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                
                {!previewUrl ? <div className="relative">
                    <Button onClick={handleCameraCapture} className="w-full h-32 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-2 border-dashed border-white/30 rounded-xl shadow-lg transition-all hover:scale-[1.02]" size="lg">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-full mb-3 mx-auto w-fit animate-pulse">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white font-medium">Capture Plant Image</p>
                        <p className="text-white/80 text-sm mt-1">Point camera at plant</p>
                      </div>
                    </Button>
                  </div> : <div className="relative">
                    <img src={previewUrl} alt="Captured plant" className="w-full h-64 object-cover rounded-xl shadow-lg" />
                    <ScanningAnimation isScanning={loading} />
                    <Button onClick={resetScanner} size="sm" variant="secondary" className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-md text-gray-700 hover:text-gray-900 z-10">
                      <X className="w-4 h-4 mr-1 text-gray-700" />
                      Retake
                    </Button>
                  </div>}
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                
                {!previewUrl ? <div className="relative">
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full h-32 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-2 border-dashed border-white/30 rounded-xl shadow-lg transition-all hover:scale-[1.02]" size="lg">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-full mb-3 mx-auto w-fit animate-pulse">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white font-medium">Upload Plant Image</p>
                        <p className="text-white/80 text-sm mt-1">Choose from gallery</p>
                      </div>
                    </Button>
                  </div> : <div className="relative">
                    <img src={previewUrl} alt="Uploaded plant" className="w-full h-64 object-cover rounded-xl shadow-lg" />
                    <ScanningAnimation isScanning={loading} />
                    <Button onClick={resetScanner} size="sm" variant="secondary" className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-md z-10">
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>}
              </TabsContent>
            </Tabs>

            {/* Analyze Button */}
            {selectedImage && !loading && results.length === 0 && <Button onClick={analyzePlant} className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95" size="lg">
                <Zap className="w-5 h-5 mr-2" />
                Analyze Plant Disease
              </Button>}

            {/* Loading State */}
            {loading && <div className="flex flex-col items-center justify-center py-8">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                  <div className="absolute -inset-2 bg-green-500/10 rounded-full animate-pulse"></div>
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-1 animate-pulse">Scanning Plant Disease</p>
                <p className="text-sm text-gray-600">AI is analyzing your plant...</p>
                <div className="mt-4 flex gap-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" ref={resultsRef}>
              {results.map((result, index) => <div key={index} className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">{result.disease}</h3>
                      <Badge variant="secondary" className={`${getConfidenceColor(result.confidence)} font-semibold px-3 py-1 bg-white border-2`}>
                        {result.confidence.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className={`${getConfidenceBgColor(result.confidence)} h-3 rounded-full transition-all duration-1000 ease-out`} style={{
                  width: `${result.confidence}%`
                }} />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Confidence: {result.confidence >= 80 ? 'High' : result.confidence >= 60 ? 'Medium' : 'Low'}
                    </p>
                  </div>

                  {/* Additional Information Section */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        How to Solve the Issue
                      </h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {result.disease.toLowerCase().includes('blight') ? 'Remove infected leaves immediately, improve air circulation, avoid overhead watering, and apply copper-based fungicides.' : result.disease.toLowerCase().includes('spot') ? 'Prune affected areas, ensure proper plant spacing, water at soil level, and apply preventive fungicide treatments.' : result.disease.toLowerCase().includes('rust') ? 'Remove infected plant parts, avoid watering leaves, improve drainage, and use resistant plant varieties when possible.' : 'Implement proper crop rotation, maintain soil health, ensure adequate spacing between plants, and monitor regularly for early detection.'}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Product Application Guide
                      </h4>
                      <p className="text-sm text-green-700 leading-relaxed">
                        Apply recommended fungicides during early morning or late evening to avoid leaf burn. 
                        Spray thoroughly covering both upper and lower leaf surfaces. Always wear protective equipment 
                        and follow label instructions for dilution rates. Ensure plants are well-watered before application.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        Treatment Duration
                      </h4>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        <span className="font-medium">Initial Treatment:</span> Apply every 7-10 days for 3-4 weeks<br />
                        <span className="font-medium">Maintenance:</span> Continue bi-weekly applications during favorable disease conditions<br />
                        <span className="font-medium">Monitor:</span> Check plants every 2-3 days for improvement or new symptoms
                      </p>
                    </div>
                  </div>
                </div>)}
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-2 border-blue-300 hover:bg-blue-50 py-3 px-3 rounded-xl font-medium text-blue-600 min-h-[56px] flex items-center justify-center" size="lg">
                      <span className="text-xs font-medium leading-tight">Download Result</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Button onClick={resetScanner} variant="outline" className="border-2 border-gray-300 hover:bg-gray-50 py-3 px-3 rounded-xl font-medium min-h-[56px] flex items-center justify-center" size="lg">
                  <span className="text-xs font-medium leading-tight">Scan Another</span>
                </Button>
              </div>
            </CardContent>
          </Card>}

        {/* Weather-Integrated Treatment Advisor */}
        {results.length > 0 && (
          <>
            <SmartTreatmentScheduler disease={results[0].disease} />
            <WeatherImpactAlerts disease={results[0].disease} />
          </>
        )}

        {/* Seasonal Care Calendar */}
        <SeasonalCareCalendar />

        {/* Recommended Products Section */}
        {results.length > 0 && <RecommendedProducts disease={results[0].disease} confidence={results[0].confidence} />}

        {/* Community Alerts Section */}
        {user && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <CommunityAlerts />
            </CardContent>
          </Card>
        )}

        {/* Diagnosis History Section */}
        {user && <DiagnosisHistory />}

        {/* Info Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-100 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Supported Plant Diseases</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span><strong>Tomato:</strong> Septoria Leaf Spot, Bacterial Spot, Early/Late Blight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span><strong>Corn:</strong> Rust, Grey Leaf Spot, Northern Leaf Blight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>Soy:</strong> Frogeye Leaf Spot, Downy Mildew</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span><strong>Cabbage:</strong> Black Rot</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  For best results, ensure good lighting and focus on affected plant parts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Purchase Drawer */}
      <Drawer open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="px-4">
            <DrawerTitle className="text-2xl font-bold">Purchase Credits</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[60vh] scrollbar-hide space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Current Balance:</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{credits} Credits</span>
            </div>
            
            {credits <= 20 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Your credits are running low! Purchase more to continue scanning.
                </p>
              </div>
            )}

            <div className="grid gap-3">
              {[
                { credits: 100, price: 299, popular: false, savings: null },
                { credits: 200, price: 499, popular: true, savings: '₱99' },
                { credits: 300, price: 699, popular: false, savings: '₱198' },
                { credits: 500, price: 999, popular: false, savings: '₱496' },
              ].map((pkg) => <Button key={pkg.credits} onClick={() => purchaseCredits(pkg.credits.toString())} disabled={purchasingCredits} className={`w-full flex items-center justify-between p-6 rounded-xl transition-all ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-2 border-green-400'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-2 border-gray-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <Coins className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-bold text-lg">{pkg.credits} Credits</p>
                      {pkg.popular && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Most Popular</span>}
                      {pkg.savings && !pkg.popular && <span className="text-xs text-green-600 font-medium">Save {pkg.savings}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">₱{pkg.price}</p>
                    <p className="text-xs opacity-80">₱{(pkg.price / pkg.credits).toFixed(2)} per scan</p>
                  </div>
                </Button>)}
            </div>

            {purchasingCredits && <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Processing purchase...</span>
              </div>}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Earn Free Credits:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Login daily to earn bonus credits</li>
                <li>• Complete achievements to earn points</li>
                <li>• Redeem points for free credits in Achievements</li>
              </ul>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Note: This is a demo purchase system. In production, this would integrate with a real payment processor.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Download Format Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Choose Download Format
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Select the format to download your analysis results:
              </p>
            </div>
            
            <div className="space-y-3">
              <Button onClick={() => {
              downloadAsPDF();
              setShowDownloadDialog(false);
            }} className="w-full justify-between bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white" size="lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>PDF Document</span>
                </div>
                <span className="text-xs opacity-80">Detailed Report</span>
              </Button>
              
              <Button onClick={() => {
              downloadAsJPEG();
              setShowDownloadDialog(false);
            }} className="w-full justify-between bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white" size="lg">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  <span>JPEG Image</span>
                </div>
                <span className="text-xs opacity-80">Visual Results</span>
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>PDF:</strong> Complete analysis report with all details and recommendations</p>
              <p><strong>JPEG:</strong> Visual screenshot of the results section for quick sharing</p>
            </div>
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

      {/* Floating Expert Assistance Button */}
      {!showAchievementsModal && (
        <TooltipProvider>
          <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowTechnicianDialog(true)} className="fixed bottom-20 right-6 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-110" size="icon">
                <MessageCircle className="w-6 h-6 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-white text-gray-900 border border-gray-200 shadow-lg animate-in fade-in-0 zoom-in-95">
              <p className="text-sm font-medium">Need expert assistance?</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>;
};
export default PlantScanner;