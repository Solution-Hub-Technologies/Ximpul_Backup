
import React from 'react';
import { Instagram, Facebook } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RainbowButton } from '@/components/ui/rainbow-button';

export const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const scrollToSection = (sectionId: string) => {
    // If we're already on the home page, just scroll
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    } else {
      // If we're on a different page, navigate to home first, then scroll
      navigate('/');
      // Use setTimeout to ensure the page has loaded before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };
  
  const navigateToPage = (path: string) => {
    navigate(path);
    // Always scroll to top when navigating to a new page
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };
  
  return (
    <footer className="border-t bg-[#f5f5f7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="mb-4">
              <img 
                src="/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png" 
                alt="Ximpul" 
                className="h-8 w-auto mx-auto md:mx-0"
              />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              World-class quality at #TruePrice.<br />
              Made with love, for Bangladesh.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="text-center">
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <button onClick={() => navigateToPage('/')} className={`transition-colors ${
                location.pathname === '/' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Ximpul Flow
              </button>
              <button onClick={() => navigateToPage('/specs')} className={`transition-colors ${
                location.pathname === '/specs' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Specs
              </button>
              <button onClick={() => scrollToSection('products')} className="text-muted-foreground hover:text-foreground transition-colors">
                Compare
              </button>
              <button onClick={() => scrollToSection('gallery')} className="text-muted-foreground hover:text-foreground transition-colors">
                Gallery
              </button>
              <button onClick={() => navigateToPage('/trueprice')} className={`transition-colors ${
                location.pathname === '/trueprice' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                #TruePrice
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </button>
              <button onClick={() => navigateToPage('/about')} className={`transition-colors ${
                location.pathname === '/about' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                About
              </button>
              <button onClick={() => navigateToPage('/terms-privacy')} className={`transition-colors ${
                location.pathname === '/terms-privacy' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Terms & Privacy
              </button>
              <button onClick={() => navigateToPage('/warranty-policy')} className={`transition-colors ${
                location.pathname === '/warranty-policy' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Warranty
              </button>
              <button onClick={() => navigateToPage('/return-policy')} className={`transition-colors ${
                location.pathname === '/return-policy' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Returns
              </button>
              <button onClick={() => navigateToPage('/contact')} className={`transition-colors ${
                location.pathname === '/contact' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Contact
              </button>
              <button onClick={() => navigateToPage('/track-order')} className={`transition-colors font-medium ${
                location.pathname === '/track-order' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Track Order
              </button>
              <button onClick={() => navigateToPage('/bulk-order')} className={`transition-colors font-medium ${
                location.pathname === '/bulk-order' ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Bulk Order
              </button>
            </div>
          </div>

          {/* Social & Contact */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold text-foreground mb-4">Connect</h4>
            <div className="flex justify-center md:justify-end space-x-4 mb-4">
              <a href="https://www.instagram.com/itsximpul/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/itsximpul" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">Follow us for updates</p>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-8 text-center">
          <h4 className="font-semibold text-foreground mb-4">We Accept</h4>
          <img 
            src="/ximpul-uploads/04b1c673-f156-4957-b472-15c13e643e3e.png" 
            alt="Payment Methods - Visa, Mastercard, American Express, and more" 
            className="mx-auto max-w-full h-auto"
          />
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">© 2025 www.ximpul.com</p>
            </div>
            
            <div className="text-center">
              <a 
                href="https://sohub.com.bd/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <img 
                  src="/ximpul-uploads/ace41ae7-2ae1-4476-85cf-1d1637a02cb0.png" 
                  alt="Solution Hub Technologies Logo" 
                  className="w-6 h-6"
                />
                <span>Solution Hub Technologies (SOHUB) Owned & Operated</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
