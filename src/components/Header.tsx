import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { Link } from "react-router-dom";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { items, searchTerm, setSearchTerm, setShowCartPanel } = useCartStore();

  const cartItemCount = items.length;

  // Add scroll listener for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the store
  };

  return (
    <>
      <header className={`bg-gray-900 shadow-lg border-b border-gray-700 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-xl' : ''}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-16">
            {/* Logo */}
            <a href="/" className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity">
              <img
                src="https://reinkarnacia.sk/engine/wp-content/themes/reinkarnacia/assets/images/logo.png"
                alt="Yogapit Logo"
                className="h-6 md:h-8 w-auto filter brightness-0 invert"
              />
              <h1 className="text-sm md:text-lg font-semibold text-white">Yogapit E-shop</h1>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
                Kanti mala
              </a>
              <a href="/" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
                Japa bag
              </a>
              <a href="/" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
                Kniha
              </a>
              <a href="/" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
                Japa mala
              </a>
              <a href="/" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
                Počítadlá
              </a>
            </nav>
            
            {/* Search and Cart */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Desktop Search */}
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Hľadať produkty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 w-64"
                  />
                </div>
              </form>
              
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {/* Cart Button */}
              <button 
                onClick={() => setShowCartPanel(true)}
                className="relative p-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <ShoppingCart className="h-5 md:h-6 w-5 md:w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>



          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-700 py-4">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="/" 
                  className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Kanti mala
                </a>
                <a 
                  href="/" 
                  className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Japa bag
                </a>
                <a 
                  href="/" 
                  className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Kniha
                </a>
                <a 
                  href="/" 
                  className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Japa mala
                </a>
                <a 
                  href="/" 
                  className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Počítadlá
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Fullscreen Search */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Vyhľadávanie</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Hľadať produkty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 text-lg"
                  autoFocus
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div className="h-12 md:h-16"></div>
    </>
  );
} 