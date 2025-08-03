import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showManualAuth, setShowManualAuth] = useState(false);
  const [authData, setAuthData] = useState({
    id: "",
    first_name: "",
    username: "",
    auth_date: "",
    hash: ""
  });

  const loginMutation = useMutation({
    mutationFn: (data: TelegramAuthData) =>
      apiRequest("/api/auth/telegram", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${data.user.first_name}`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleManualAuth = () => {
    const telegramData: TelegramAuthData = {
      id: parseInt(authData.id),
      first_name: authData.first_name,
      username: authData.username || undefined,
      auth_date: parseInt(authData.auth_date) || Math.floor(Date.now() / 1000),
      hash: authData.hash || "mock_hash_for_testing"
    };

    loginMutation.mutate(telegramData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login to NutriShop</CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Connect with Telegram to start shopping and earning referral rewards
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Telegram Widget Placeholder */}
          <div className="text-center space-y-4">
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Telegram Login Widget</h3>
              <p className="text-sm opacity-90">
                In production, the official Telegram login widget would appear here
              </p>
            </div>
            
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Demo Mode - Testing Available Below
            </Badge>
          </div>

          {/* Manual Testing Form */}
          <div className="space-y-4">
            <Button 
              onClick={() => setShowManualAuth(!showManualAuth)}
              variant="outline" 
              className="w-full"
            >
              {showManualAuth ? "Hide" : "Show"} Test Login Form
            </Button>

            {showManualAuth && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label htmlFor="id">Telegram User ID</Label>
                  <Input
                    id="id"
                    placeholder="123456789"
                    value={authData.id}
                    onChange={(e) => setAuthData(prev => ({ ...prev, id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    value={authData.first_name}
                    onChange={(e) => setAuthData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    placeholder="john_doe"
                    value={authData.username}
                    onChange={(e) => setAuthData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleManualAuth}
                  disabled={!authData.id || !authData.first_name || loginMutation.isPending}
                  className="w-full"
                >
                  {loginMutation.isPending ? "Logging in..." : "Test Login"}
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p className="font-semibold">How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• In production, users click the official Telegram login button</li>
              <li>• Telegram authenticates and sends verified user data</li>
              <li>• Your backend validates the signature and creates a secure session</li>
              <li>• Users get instant access with their referral code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}