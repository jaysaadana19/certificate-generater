import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Award, Upload, Download } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Award className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Certificate Generator
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Create and distribute beautiful certificates effortlessly
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">For Admins</h3>
            <p className="text-gray-600 mb-6">
              Upload your certificate template, add recipient list via CSV, and generate certificates in bulk
            </p>
            <Button
              data-testid="admin-panel-btn"
              onClick={() => navigate('/admin')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Go to Admin Panel
            </Button>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
              <Download className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">For Recipients</h3>
            <p className="text-gray-600 mb-6">
              Enter your name and email to instantly download your personalized certificate
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
              <p className="font-semibold mb-1">📧 Need your certificate?</p>
              <p>Check your email or contact the event organizer for your personalized download link</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Upload Template</h4>
              <p className="text-gray-600 text-sm">Upload your certificate design (PNG/JPEG)</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Upload CSV</h4>
              <p className="text-gray-600 text-sm">Add recipient names and emails via CSV file</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Generate & Share</h4>
              <p className="text-gray-600 text-sm">Recipients can download their certificates anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}