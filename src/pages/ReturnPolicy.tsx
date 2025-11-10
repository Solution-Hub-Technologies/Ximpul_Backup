import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CheckCircle, XCircle, Mail, RefreshCw, Shield, ArrowRight, Clock, Heart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium mb-8">
            <RefreshCw className="w-5 h-5" />
            <span>7-Day Return Window</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Return &
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Exchange</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Changed your mind? No worries. We accept returns within 7 days of delivery for eligible items.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Return Eligibility Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Eligible for Return */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-green-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Eligible for Return</h2>
                    <p className="text-green-600 font-medium">These qualify for return</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Product is unused, in original condition and packaging',
                    'Valid reason (wrong item, color, cap, or accidental order)'
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

            {/* Not Eligible for Return */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Not Eligible</h2>
                    <p className="text-red-600 font-medium">These cannot be returned</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Personalized/engraved bottles',
                    'Used or damaged items',
                    'Accessories sold separately'
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

          {/* Return Process Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">🧾 How to Request a Return</h2>
                <p className="text-xl text-purple-100">Simple process within 7 days of delivery</p>
              </div>
              
              <div className="grid md:grid-cols-4 gap-6 mb-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">1. Email Us</h3>
                  <p className="text-purple-100 text-sm">Within 7 days</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">2. Send Photos</h3>
                  <p className="text-purple-100 text-sm">Product condition</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">3. We Review</h3>
                  <p className="text-purple-100 text-sm">Quick approval</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">4. Return/Refund</h3>
                  <p className="text-purple-100 text-sm">Your choice</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">📋 Include in Your Email:</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-purple-200" />
                    <span>Order number</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-purple-200" />
                    <span>Reason for return</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-purple-200" />
                    <span>Product photos</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button asChild className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-bold">
                  <a href="mailto:ximpulshop@gmail.com">
                    <Mail className="w-5 h-5 mr-2" />
                    Request Return Now
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Return Process Details */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📬 What Happens Next?</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">After Approval:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">We send return instructions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">You ship the item back</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">We inspect upon receipt</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Resolution (7 days):</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-green-800">Exchange for new item</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-green-800">Full refund via bKash/Nagad</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-green-800">Bank transfer option</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promise Section */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">💡 Our Promise to You</h2>
              
              <div className="space-y-4 mb-8">
                <p className="text-xl text-gray-300">
                  We don't just sell bottles. We build trust.
                </p>
                <p className="text-lg text-gray-400">
                  If anything goes wrong, we'll always listen first, and aim to make things right — fairly, and with care.
                </p>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 mb-8">
                <h3 className="text-2xl font-bold mb-4">🔐 Your Water. Your Freedom. Our Responsibility.</h3>
              </div>
              
              <Button asChild className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-bold">
                <a href="/contact">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Support Team
                </a>
              </Button>
            </div>
          </div>

        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ReturnPolicy;