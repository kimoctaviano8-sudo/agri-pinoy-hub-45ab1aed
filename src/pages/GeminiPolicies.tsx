import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const GeminiPolicies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Gemini Policies</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground mb-6">
            Comprehensive policies and terms for agricultural services and platform usage.
          </p>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="w-full overflow-x-auto flex justify-start mb-4">
              <TabsTrigger value="terms" className="text-xs lg:text-sm whitespace-nowrap">Terms</TabsTrigger>
              <TabsTrigger value="privacy" className="text-xs lg:text-sm whitespace-nowrap">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-4 text-sm">
              <div className="space-y-3">
                <h3 className="font-semibold text-base">General Terms of Service</h3>
                <div className="space-y-2">
                  <p><strong>1. Platform Usage:</strong> Gemini is an agricultural technology platform designed to assist farmers with crop management, disease diagnosis, and agricultural product procurement.</p>
                  <p><strong>2. User Responsibilities:</strong> Users must provide accurate information about their crops, farming practices, and personal details for optimal service delivery.</p>
                  <p><strong>3. Service Availability:</strong> We strive to maintain 24/7 service availability but may have scheduled maintenance periods with prior notice.</p>
                  <p><strong>4. Account Security:</strong> Users are responsible for maintaining the confidentiality of their account credentials and for all activities under their account.</p>
                  <p><strong>5. Intellectual Property:</strong> All content, features, and functionality on the platform are owned by Gemini and protected by intellectual property laws.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agriculture" className="space-y-4 text-sm">
              <div className="space-y-3">
                <h3 className="font-semibold text-base">Agricultural Services Policy</h3>
                <div className="space-y-2">
                  <p><strong>1. Crop Diagnosis Accuracy:</strong> Our AI-powered plant disease detection provides guidance based on image analysis. Results should be verified with local agricultural experts.</p>
                  <p><strong>2. Treatment Recommendations:</strong> All treatment suggestions are based on best agricultural practices but should be adapted to local conditions and regulations.</p>
                  <p><strong>3. Weather Integration:</strong> Weather-based recommendations are provided using reliable meteorological data but may vary due to microclimate conditions.</p>
                  <p><strong>4. Farming Techniques:</strong> We promote sustainable and environmentally friendly farming practices while respecting traditional agricultural knowledge.</p>
                  <p><strong>5. Crop Rotation Guidelines:</strong> Our seasonal care recommendations follow established agricultural science but should be customized to your specific soil and climate conditions.</p>
                  <p><strong>6. Fertilizer and Pesticide Use:</strong> Always follow local regulations and safety guidelines when applying recommended treatments.</p>
                </div>
              </div>
            </TabsContent>




            <TabsContent value="privacy" className="space-y-4 text-sm">
              <div className="space-y-3">
                <h3 className="font-semibold text-base">Privacy and Data Protection</h3>
                <div className="space-y-2">
                  <p><strong>1. Data Collection:</strong> We collect information necessary to provide agricultural services including crop photos, location data, and farming practices.</p>
                  <p><strong>2. Data Usage:</strong> Your data is used to improve our AI models, provide personalized recommendations, and deliver relevant agricultural content.</p>
                  <p><strong>3. Data Sharing:</strong> We do not sell personal data. Anonymized agricultural data may be shared with research institutions to advance agricultural science.</p>
                  <p><strong>4. Location Privacy:</strong> Location data is used for weather integration and local recommendations. You can disable location sharing at any time.</p>
                  <p><strong>5. Image Privacy:</strong> Crop photos are processed for disease detection and may be used to improve our AI models with your consent.</p>
                  <p><strong>6. Data Security:</strong> We implement industry-standard security measures to protect your personal and agricultural data.</p>
                  <p><strong>7. Data Retention:</strong> Personal data is retained as long as your account is active. Agricultural data may be retained longer for research purposes in anonymized form.</p>
                  <p><strong>8. Your Rights:</strong> You have the right to access, modify, or delete your personal data. Contact our support team for data requests.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GeminiPolicies;
