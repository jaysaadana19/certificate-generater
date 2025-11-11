import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, Award, ArrowLeft, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DownloadPage() {
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState('png');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventSlug) {
      fetchEvent();
    }
  }, [eventSlug]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API}/events/slug/${eventSlug}`);
      setEvent(response.data);
    } catch (error) {
      toast.error('Event not found');
    }
  };

  const handleDownload = async () => {
    if (!name || !email) {
      toast.error('Please enter both name and email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/certificates/download`,
        { name, email, format },
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'png';
      link.setAttribute('download', `${name}_certificate.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Certificate downloaded as ${extension.toUpperCase()} successfully!`);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Certificate not found. Please check your name and email.');
      } else {
        toast.error('Failed to download certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-rose-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 max-w-2xl relative z-10">
        <Button
          data-testid="back-home-btn"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-white/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-5 rounded-3xl shadow-2xl animate-float">
              <Award className="w-20 h-20 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-fuchsia-500" />
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Download Your Certificate
            </h1>
            <Sparkles className="w-6 h-6 text-fuchsia-500" />
          </div>
          {event && (
            <p className="text-2xl text-gray-700 font-semibold">{event.name}</p>
          )}
        </div>

        <Card className="shadow-2xl border-2 border-fuchsia-300 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-violet-100 via-fuchsia-100 to-pink-100">
            <CardTitle className="text-3xl">Enter Your Details</CardTitle>
            <CardDescription className="text-lg">Please provide the name and email used during registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                data-testid="download-name-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-300 py-6 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                data-testid="download-email-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-300 py-6 text-lg"
              />
            </div>

            <Button
              data-testid="download-submit-btn"
              onClick={handleDownload}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white py-8 text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Downloading...
                </div>
              ) : (
                <>
                  <Download className="w-7 h-7 mr-3" />
                  Download Certificate
                </>
              )}
            </Button>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-5 rounded-2xl mt-6 border-2 border-blue-300">
              <p className="text-base text-blue-900">
                <strong className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Note:</strong> Make sure to enter the exact name and email that was used when the certificate was generated.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}