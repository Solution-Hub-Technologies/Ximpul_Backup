
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { sanitizeForLog } from '@/utils/security';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button';

interface Initiative {
  id: string;
  name: string;
  description: string;
  href: string | null;
  logo: string;
  order: number;
  isActive: boolean;
}

interface NavigationProps {
  hideNavHeader?: boolean;
}

export const Navigation = ({ hideNavHeader = false }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [initiativesOpen, setInitiativesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch('https://sohub.com.bd/api/initiatives.json', {
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => setInitiatives(Array.isArray(data) ? data : data.initiatives || []))
      .catch(() => { });
  }, []);



  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Only track sections on home page
      if (location.pathname === '/') {
        const sections = ['gallery', 'products', 'faq'];
        const scrollPosition = window.scrollY + 100;
        let foundActive = false;

        for (const sectionId of sections) {
          const element = document.getElementById(sectionId);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSection(sectionId);
              foundActive = true;
              console.log('Setting active section to:', sanitizeForLog(sectionId));
              break;
            }
          }
        }

        // If at top of page, no section is active
        if (window.scrollY < 200 || !foundActive) {
          if (activeSection !== '') {
            console.log('Clearing active section');
            setActiveSection('');
          }
        }
      } else {
        // Clear active section when not on home page
        if (activeSection !== '') {
          setActiveSection('');
        }
      }
    };

    // Run once on mount to set initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, activeSection]);

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);

    // If we're already on the home page, just scroll
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const navbarHeight = 48; // 12 * 4 = 48px (h-12 class)
        const elementPosition = element.offsetTop - navbarHeight;
        window.scrollTo({
          top: elementPosition,
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
          const navbarHeight = 48; // 12 * 4 = 48px (h-12 class)
          const elementPosition = element.offsetTop - navbarHeight;
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const goToHome = () => {
    setIsMobileMenuOpen(false);
    navigate('/');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const navigateToPage = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
    // Always scroll to top when navigating to a new page
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const navItems = [{
    name: 'Ximpul Flow',
    action: goToHome
  }, {
    name: 'Specs',
    action: () => navigateToPage('/specs')
  }, {
    name: 'Gallery',
    action: () => scrollToSection('gallery')
  }, {
    name: 'Compare',
    action: () => scrollToSection('products')
  }, {
    name: 'FAQ',
    action: () => scrollToSection('faq')
  }, {
    name: 'Bulk Order',
    action: () => navigateToPage('/bulk-order')
  }, {
    name: '#TruePrice',
    action: () => navigateToPage('/trueprice')
  }];

  // Debug active section
  console.log('Active Section:', sanitizeForLog(activeSection));
  console.log('Current Path:', sanitizeForLog(location.pathname));

  return (
    <>
      <div className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-sm border-b shadow-sm' : 'bg-white border-b border-white/10'}`}>
        <div className={`bg-secondary/50 border-b border-border/50 transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0.5">
            <div className="flex items-center justify-between">
              <a href="https://sohub.com.bd/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <img src="/ximpul-uploads/ace41ae7-2ae1-4476-85cf-1d1637a02cb0.png" alt="Solution Hub" className="h-6" />
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  <span className="hidden md:inline">Solution Hub Technologies(SOHUB) Owned & Operated</span>
                  <span className="md:hidden">SOHUB owned & operated</span>
                </p>
              </a>
              <div className="flex items-center gap-2">
                <DropdownMenu modal={false} onOpenChange={setInitiativesOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground gap-1 md:mr-0 -mr-4">
                      <span>Our Initiatives</span>
                      {initiativesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[320px] p-3">
                    <div className="grid grid-cols-3 gap-3">
                      {initiatives.map((initiative) => {
                        return initiative.href ? (
                          <a
                            key={initiative.id}
                            href={initiative.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                            className="flex items-center justify-center p-4 rounded-lg border border-border"
                          >
                            <img src={`https://sohub.com.bd${initiative.logo}`} alt={initiative.name} className="w-full h-full object-contain" />
                          </a>
                        ) : (
                          <div
                            key={initiative.id}
                            className="flex items-center justify-center p-4 rounded-lg border border-border opacity-50 cursor-not-allowed"
                          >
                            <img src={`https://sohub.com.bd${initiative.logo}`} alt={initiative.name} className="w-full h-full object-contain" />
                          </div>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {!hideNavHeader && (
          <nav className="w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-12">
                {/* Logo - Now using the uploaded image */}
                <button onClick={goToHome} className="flex items-center space-x-2">
                  <img
                    src="/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png"
                    alt="Ximpul"
                    className="h-8 w-auto"
                  />
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                  {navItems.map(item => {
                    const isActive = (item.name === 'Ximpul Flow' && location.pathname === '/' && activeSection === '') ||
                      (item.name === 'Specs' && location.pathname === '/specs') ||
                      (item.name === 'Bulk Order' && location.pathname === '/bulk-order') ||
                      (item.name === '#TruePrice' && location.pathname === '/trueprice') ||
                      (item.name === 'Gallery' && activeSection === 'gallery') ||
                      (item.name === 'Compare' && activeSection === 'products') ||
                      (item.name === 'FAQ' && activeSection === 'faq');

                    // Debug which items are active
                    if (isActive) {
                      console.log('Active nav item:', sanitizeForLog(item.name));
                    }

                    return (
                      <button
                        key={item.name}
                        onClick={item.action}
                        className={`text-sm transition-colors ${isActive ? 'text-black font-bold' : 'text-black font-medium'
                          }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Buy Button */}
                <div className="hidden md:flex items-center">
                  <RainbowButton className="h-8 px-4 text-sm" onClick={() => scrollToSection('buy')}>
                    Buy
                  </RainbowButton>
                </div>

                {/* Mobile Buy Button and Menu Button */}
                <div className="md:hidden flex items-center space-x-2">
                  <RainbowButton
                    className="h-7 px-3 text-sm"
                    onClick={() => scrollToSection('buy')}
                  >
                    Buy
                  </RainbowButton>
                  <button
                    className="p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>

              {/* Mobile Menu */}
              {isMobileMenuOpen && (
                <div className="md:hidden bg-background border-t">
                  <div className="px-2 pt-2 pb-3 space-y-1">
                    {navItems.map(item => {
                      const isActive = (item.name === 'Ximpul Flow' && location.pathname === '/' && activeSection === '') ||
                        (item.name === 'Specs' && location.pathname === '/specs') ||
                        (item.name === 'Bulk Order' && location.pathname === '/bulk-order') ||
                        (item.name === '#TruePrice' && location.pathname === '/trueprice') ||
                        (item.name === 'Gallery' && activeSection === 'gallery') ||
                        (item.name === 'Compare' && activeSection === 'products') ||
                        (item.name === 'FAQ' && activeSection === 'faq');
                      return (
                        <button
                          key={item.name}
                          onClick={item.action}
                          className={`block w-full text-left px-3 py-2 text-base ${isActive ? 'text-black font-bold' : 'text-muted-foreground hover:text-foreground font-medium'
                            }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Floating Left "New Lineup" Liquid Metal Button - Completely independent of header container */}
      {location.pathname !== '/new-lineup' && (
        <div className="fixed left-4 sm:left-6 bottom-6 sm:bottom-8 z-50">
          <LiquidMetalButton
            label="New Lineup"
            onClick={() => navigateToPage('/new-lineup')}
          />
        </div>
      )}
    </>
  );
};
