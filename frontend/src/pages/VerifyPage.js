import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Search, ArrowLeft, Shield, Calendar, User, Mail, Award } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VerifyPage() {
  const navigate = useNavigate();
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    if (!certId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.get(`${API}/certificates/verify/${certId.trim()}`);
      setResult(response.data);
      
      if (response.data.valid) {
        toast.success('Certificate verified successfully!');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setResult({ valid: false, error: 'Certificate not found' });
        toast.error('Certificate not found');
      } else {
        toast.error('Failed to verify certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl relative z-10">
        <Button
          data-testid="back-home-verify-btn"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-white/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-5 rounded-3xl shadow-2xl animate-float">
              <Shield className="w-20 h-20 text-white" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Verify Certificate
          </h1>
          <p className="text-xl text-gray-700">Enter certificate ID to verify authenticity</p>
        </div>

        <Card className="shadow-2xl border-2 border-emerald-300 bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100">
            <CardTitle className="text-3xl flex items-center gap-2">
              <Search className="w-8 h-8" />
              Enter Certificate ID
            </CardTitle>
            <CardDescription className="text-lg">The certificate ID can be found at the bottom of your certificate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="certId" className="text-lg">Certificate ID</Label>
              <Input
                id="certId"
                data-testid="cert-id-input"
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-300 py-6 text-lg font-mono"
              />
            </div>

            <Button
              data-testid="verify-btn"
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white py-7 text-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Verifying...
                </div>
              ) : (
                <>
                  <Search className="w-6 h-6 mr-2" />
                  Verify Certificate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {result && (
          <Card className={`shadow-2xl border-2 ${result.valid ? 'border-green-400 bg-green-50/90' : 'border-red-400 bg-red-50/90'} backdrop-blur-sm`}>
            <CardHeader className={`${result.valid ? 'bg-gradient-to-r from-green-100 to-emerald-100' : 'bg-gradient-to-r from-red-100 to-rose-100'}`}>
              <CardTitle className="text-3xl flex items-center gap-3">
                {result.valid ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-green-600" />
                    <span className="text-green-800">Certificate Valid</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-10 h-10 text-red-600" />
                    <span className="text-red-800">Certificate Invalid</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {result.valid ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border-2 border-green-200">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <User className="w-5 h-5" />
                            <span className="font-semibold">Recipient Name</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800 ml-7">{result.certificate.name}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Mail className="w-5 h-5" />
                            <span className="font-semibold">Email Address</span>
                          </div>
                          <p className="text-lg text-gray-800 ml-7">{result.certificate.email}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Award className="w-5 h-5" />
                            <span className="font-semibold">Event Name</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800 ml-7">{result.certificate.event_name}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Calendar className="w-5 h-5" />
                            <span className="font-semibold">Issue Date</span>
                          </div>
                          <p className="text-lg text-gray-800 ml-7">
                            {new Date(result.certificate.issued_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t-2 border-green-200">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Shield className="w-5 h-5" />
                        <span className="font-semibold">Certificate ID</span>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 p-3 rounded-lg text-gray-800 ml-7 break-all">
                        {result.certificate.id}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-5">
                    <p className="text-green-800 text-center font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      This certificate has been verified as authentic and valid
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6">
                    <p className="text-red-800 text-center text-lg font-semibold flex items-center justify-center gap-2">
                      <XCircle className="w-6 h-6" />
                      {result.error || 'This certificate could not be verified'}
                    </p>
                  </div>
                  <p className="text-gray-600 text-center">
                    Please check the certificate ID and try again. If you believe this is an error, contact the certificate issuer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-cyan-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-3 text-gray-800">How to find your Certificate ID?</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 font-bold mt-1">•</span>
                <span>The Certificate ID is printed at the bottom-right corner of your certificate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 font-bold mt-1">•</span>
                <span>It's a unique identifier in the format: Certificate ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 font-bold mt-1">•</span>
                <span>Copy and paste the ID (without "Certificate ID:" prefix) into the field above</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
