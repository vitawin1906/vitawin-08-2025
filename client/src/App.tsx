import React from "react";

import Index from "./pages/Index";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";

import Contact from "./pages/Contact";

import Account from "./pages/Account";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Checkout from "./pages/Checkout";
// import CheckoutTest from "./pages/CheckoutTest";
import QuickCheckout from "./pages/QuickCheckout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import OrderCancelled from "./pages/OrderCancelled";
import CheckoutFail from "./pages/CheckoutFail";
import Affiliate from "./pages/Affiliate";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import MessageDemo from "./pages/MessageDemo";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContractOffer from "./pages/ContractOffer";
import TermsOfService from "./pages/TermsOfService";

import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import {PerformanceMonitor, preloadCriticalResources} from "./utils/performanceUtils";
import {useAuthSync} from "./hooks/useAuthSync";
import CustomScripts from "./components/CustomScripts";
import TelegramAutoAuth from "./components/TelegramAutoAuth";
import ScrollToTop from "./components/ScrollToTop";
import AuthSuccessNotification from "./components/AuthSuccessNotification";
import {Switch} from "./components/ui/switch";
import {LanguageProvider} from "./contexts/LanguageContext";
import {MessageProvider} from "./contexts/MessageContext";
import {queryClient} from "./lib/queryClient";
import {TooltipProvider} from "./components/ui/tooltip";
import {Toaster} from "./components/ui/sonner";

function Route(props: { path: string, component: () => JSX.Element }) {
  return null;
}

const AppContent = () => {
  useAuthSync(); // Включаем синхронизацию авторизации между вкладками
  
  // Инициализируем мониторинг производительности
  React.useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.initializeMonitoring();
    preloadCriticalResources();
  }, []);
  
  return (
    <>
      <CustomScripts position="head" />
      <TelegramAutoAuth />
      <ScrollToTop />
      <AuthSuccessNotification />
      
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/store" component={Store} />
        <Route path="/product/:identifier" component={ProductDetail} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/account" component={Account} />
        <Route path="/auth" component={Auth} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/quick-checkout" component={QuickCheckout} />
        <Route path="/checkout-success" component={CheckoutSuccess} />
        <Route path="/checkout-failed" component={CheckoutFail} />
        <Route path="/order-success" component={OrderSuccess} />
        <Route path="/order-cancelled" component={OrderCancelled} />
        <Route path="/affiliate" component={Affiliate} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:id" component={BlogArticle} />
        <Route path="/message-demo" component={MessageDemo} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/contract-offer" component={ContractOffer} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      
      <CustomScripts position="body" />
    </>
  );
};

function QueryClientProvider(props: { client: any, children: ReactNode }) {
  return null;
}

function Sonner() {
  return null;
}

function Router(props: { children: ReactNode }) {
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <MessageProvider position="top-right">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <AppContent />
          </Router>
        </TooltipProvider>
      </MessageProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;