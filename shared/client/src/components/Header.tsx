
import { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, ShoppingCart, Search, User, LogOut } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import TelegramAuthModal from './TelegramAuthModal';

interface HeaderProps {
  onCartClick: () => void;
}

const Header = ({ onCartClick }: HeaderProps) => {
  const { t } = useLanguage();
  const cartItems = useCartStore(state => state.items);
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/vitawin-logo.png" 
              alt="VitaWin" 
              className="h-8 sm:h-10 md:h-12 w-auto"
              width="120"
              height="48"
              loading="eager"
              decoding="async"
              style={{ minWidth: '80px', minHeight: '32px' }}
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
              Главная
            </Link>
            <Link to="/store" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
              Товары
            </Link>
            <Link to="/blog" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
              Блог
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
              О нас
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
              Контакты
            </Link>
          </nav>

          {/* Right side of header */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher - Desktop only */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Login/Profile Button - Desktop */}
            {user ? (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/account" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.name || 'Профиль'}</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button 
                className="hidden md:flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Войти</span>
              </button>
            )}

            {/* Mobile Account & Cart Icons */}
            <div className="flex md:hidden items-center space-x-3">
              {/* Mobile Account Icon */}
              {user ? (
                <Link to="/account" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  <User className="h-6 w-6" />
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <User className="h-6 w-6" />
                </button>
              )}

              {/* Mobile Cart */}
              <div className="relative">
                <button
                  onClick={onCartClick}
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                </button>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full text-xs px-1.5 font-medium">
                    {cartItems.length}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Cart */}
            <div className="relative hidden md:block">
              <button
                onClick={onCartClick}
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
              </button>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full text-xs px-1.5 font-medium">
                  {cartItems.length}
                </span>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 pt-6 w-72">
                  {/* Mobile Search */}
                  <div className="px-4 pb-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Поиск товаров..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="px-4 py-4 space-y-2">
                    <Link
                      to="/"
                      className="block py-3 text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Главная
                    </Link>
                    <Link
                      to="/store"
                      className="block py-3 text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Товары
                    </Link>
                    <Link
                      to="/blog"
                      className="block py-3 text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Блог
                    </Link>
                    <Link
                      to="/about"
                      className="block py-3 text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      О нас
                    </Link>
                    <Link
                      to="/contact"
                      className="block py-3 text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Контакты
                    </Link>
                    <div className="pt-4 border-t border-gray-200">
                      {user ? (
                        <>
                          <Button variant="ghost" size="sm" className="w-full justify-start mb-2" asChild>
                            <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>
                              <User className="h-4 w-4 mr-2" />
                              {user.name || 'Профиль'}
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Выйти
                          </Button>
                        </>
                      ) : (
                        <button 
                          className="w-full flex items-center justify-start space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors font-medium"
                          onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                          </svg>
                          <span>Войти</span>
                        </button>
                      )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Auth Modal */}
      <TelegramAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
