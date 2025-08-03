import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, DollarSign, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface User {
  id: number;
  first_name: string;
  username?: string;
  referral_code: string;
  is_admin: boolean;
  referral_stats: {
    referral_code: string;
    total_referrals: number;
    total_earnings: string;
    pending_rewards: string;
    recent_referrals: any[];
  };
}

interface Order {
  id: number;
  total: string;
  status: string;
  items: any[];
  created_at: string;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user/me"],
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/orders"],
  });

  const copyReferralCode = () => {
    if (currentUser?.referral_code) {
      navigator.clipboard.writeText(currentUser.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const copyReferralLink = () => {
    if (currentUser?.referral_code) {
      const link = `${window.location.origin}?ref=${currentUser.referral_code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-bold mb-4">Please Login</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to access your dashboard.</p>
            <Link href="/login">
              <Button>Login with Telegram</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer">
                  NutriShop
                </h1>
              </Link>
              <Badge variant="secondary">Dashboard</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Welcome, {currentUser.first_name}!
              </span>
              {currentUser.is_admin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Shop
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${currentUser.referral_stats?.total_earnings || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                From {currentUser.referral_stats?.total_referrals || 0} referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentUser.referral_stats?.total_referrals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                People you've referred
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ordersData?.orders?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Your total orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${currentUser.referral_stats?.pending_rewards || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Being processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="referrals">Referral Program</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referral Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Referral Code</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Share this code to earn 5% commission on every sale
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Referral Code</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={currentUser.referral_code} 
                        readOnly 
                        className="font-mono text-lg"
                      />
                      <Button onClick={copyReferralCode} size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Referral Link</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={`${window.location.origin}?ref=${currentUser.referral_code}`}
                        readOnly 
                        className="text-sm"
                      />
                      <Button onClick={copyReferralLink} size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      How it works:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Share your referral code or link</li>
                      <li>• When someone uses it to make a purchase</li>
                      <li>• You earn 5% commission automatically</li>
                      <li>• Track your earnings in real-time</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    People who joined using your code
                  </p>
                </CardHeader>
                <CardContent>
                  {currentUser.referral_stats?.recent_referrals?.length > 0 ? (
                    <div className="space-y-3">
                      {currentUser.referral_stats.recent_referrals.map((referral, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium">Referral #{referral.id}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Earned: ${referral.reward_earned}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">
                        No referrals yet. Start sharing your code!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Track all your purchases and their status
                </p>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading orders...</p>
                  </div>
                ) : ordersData?.orders?.length > 0 ? (
                  <div className="space-y-4">
                    {ordersData.orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">Order #{order.id}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${order.total}</p>
                            <Badge variant={
                              order.status === "delivered" ? "default" :
                              order.status === "shipped" ? "secondary" :
                              order.status === "processing" ? "outline" : "destructive"
                            }>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.items?.length || 0} items
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      No orders yet. Start shopping!
                    </p>
                    <Link href="/">
                      <Button>Browse Products</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your account details from Telegram
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={currentUser.first_name} readOnly />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input value={currentUser.username || "Not set"} readOnly />
                  </div>
                  <div>
                    <Label>User ID</Label>
                    <Input value={currentUser.id.toString()} readOnly />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Input value={currentUser.is_admin ? "Administrator" : "Customer"} readOnly />
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Account Benefits:</h4>
                  <ul className="text-sm space-y-1">
                    <li>✓ Secure Telegram authentication</li>
                    <li>✓ Automatic referral tracking</li>
                    <li>✓ Real-time commission updates</li>
                    <li>✓ Order history and tracking</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}