import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Award, Upload, Download, BarChart3, Sparkles, Shield } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-pink-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-5 rounded-3xl shadow-2xl animate-float">
              <Award className="w-20 h-20 text-white" />
            </div>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Certificate Generator
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-fuchsia-500" />
            <p className="text-xl sm:text-2xl text-gray-700 font-medium">Create and distribute beautiful certificates effortlessly</p>
            <Sparkles className="w-5 h-5 text-fuchsia-500" />
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all border-2 border-emerald-200 hover:scale-105 hover:border-emerald-400">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg mx-auto">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-gray-800 text-center">Verify Certificate</h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed text-center">
              Verify the authenticity of any certificate using its unique certificate ID
            </p>
            <Button
              data-testid="verify-cert-btn"
              onClick={() => navigate('/verify')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl py-8 text-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Verify Certificate Now
            </Button>
          </div>
        </div>

        {/* Info for Recipients */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-fuchsia-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-400 to-fuchsia-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">For Certificate Recipients</h3>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 border-2 border-fuchsia-300 rounded-2xl p-6">
              <p className="font-semibold text-fuchsia-800 mb-3 flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5" />
                Need your certificate?
              </p>
              <p className="text-fuchsia-700 text-base leading-relaxed">
                Check your email for a personalized download link from the event organizer. You can use that link to download your certificate in PNG or PDF format anytime.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border-2 border-violet-200">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg">
                1
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-800">Upload Template</h4>
              <p className="text-gray-600">Upload your certificate design (PNG/JPEG) and configure text placement</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-fuchsia-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg">
                2
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-800">Upload CSV</h4>
              <p className="text-gray-600">Add recipient names and emails via CSV file for bulk processing</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg">
                3
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-800">Generate & Share</h4>
              <p className="text-gray-600">Recipients can download their certificates anytime using the event link</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}