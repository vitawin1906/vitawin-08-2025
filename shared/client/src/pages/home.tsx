import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Star } from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  image: string;
  stock: number;
}

interface ProductResponse {
  success: boolean;
  products: Product[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export default function Home() {
  const { data: productsData, isLoading } = useQuery<ProductResponse>({
    queryKey: ["/api/products"],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/me"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                NutriShop
              </h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Affiliate Boost
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Welcome, {currentUser.first_name}!
                  </span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="outline">Login with Telegram</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Premium Nutrition Products
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Boost your health with our carefully selected supplements and earn rewards through our referral program
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Shop Now
            </Button>
            <Button size="lg" variant="outline">
              <Users className="h-5 w-5 mr-2" />
              Join Referral Program
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All products are tested and certified for maximum effectiveness
              </p>
            </div>
            <div className="p-6">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Referral Rewards</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Earn 5% commission on every sale from your referrals
              </p>
            </div>
            <div className="p-6">
              <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple checkout process with Telegram authentication
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Featured Products
          </h3>
          
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-600 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : productsData?.products?.length ? (
            <div className="grid md:grid-cols-3 gap-6">
              {productsData.products.slice(0, 6).map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl">📦</div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{product.title}</CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                      <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full" 
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                No products available yet. Check back soon!
              </p>
              {currentUser?.is_admin && (
                <Link href="/admin">
                  <Button className="mt-4">Add Products</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h4 className="text-2xl font-bold mb-4">Ready to Start Earning?</h4>
          <p className="text-gray-400 mb-6">
            Join our affiliate program and start earning commissions on every sale
          </p>
          {!currentUser && (
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                Get Started with Telegram
              </Button>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}