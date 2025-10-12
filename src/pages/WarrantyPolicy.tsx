import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Shield, CheckCircle, XCircle, Mail, Clock, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WarrantyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm font-medium mb-8">
            <Shield className="w-5 h-5" />
            <span>6-Month Protection Guarantee</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Warranty
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Policy</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Your Ximpul Flow is protected with our comprehensive 6-month replacement warranty for manufacturing defects.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Coverage Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* What's Covered */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-green-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">What's Covered</h2>
                    <p className="text-green-600 font-medium">We've got you protected</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Defective insulation (doesn\'t retain heat/cold)',
                    'Faulty caps or leaks due to manufacturing fault',
                    'Broken handle or cap issues (not caused by misuse)',
                    'Engraving errors caused by our team'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What's Not Covered */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Not Covered</h2>
                    <p className="text-red-600 font-medium">Please take care of these</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Damage from drops, dents, or accidents',
                    'Normal wear and tear or scratches',
                    'Damage from misuse (freezer, boiling water)',
                    'Unauthorized repairs or modifications'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* How to Claim Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">🛠 How to Claim Your Warranty</h2>
                <p className="text-xl text-blue-100">Simple 3-step process to get your replacement</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">1. Email Us</h3>
                  <p className="text-blue-100">Send details to ximpulshop@gmail.com</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">2. We Review</h3>
                  <p className="text-blue-100">Our team checks eligibility</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">3. Free Replacement</h3>
                  <p className="text-blue-100">Shipping included if approved</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">📋 What to Include in Your Email:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-blue-200" />
                    <span>Clear photos of the issue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-blue-200" />
                    <span>Order number / purchase proof</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button asChild className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-bold">
                  <a href="mailto:ximpulshop@gmail.com">
                    <Mail className="w-5 h-5 mr-2" />
                    Start Your Warranty Claim
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Processing Time */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">📦 Processing Time</h2>
              <p className="text-xl text-gray-600 mb-2">3–5 working days</p>
              <p className="text-gray-500">From claim submission to resolution</p>
            </div>
          </div>

        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default WarrantyPolicy;