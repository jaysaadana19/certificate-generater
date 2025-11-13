import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Award, Users, Calendar, Download, TrendingUp, FileText, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCertificates = async (eventId, eventName) => {
    try {
      const response = await axios.get(
        `${API}/events/${eventId}/certificates/export`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${eventName.replace(/[^a-z0-9]/gi, '_')}_certificates.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Certificates data exported successfully!');
    } catch (error) {
      toast.error('Failed to export certificates');
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This will delete the event, all certificates, and associated files. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/events/${eventId}`);
      toast.success(`Event "${eventName}" deleted successfully! ${response.data.certificates_deleted} certificates removed.`);
      fetchDashboardStats(); // Refresh the dashboard
    } catch (error) {
      toast.error('Failed to delete event');
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            data-testid="back-to-admin-btn"
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Overview of your certificate generation activity</p>
            </div>
            <Button
              data-testid="refresh-stats-btn"
              onClick={fetchDashboardStats}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Events */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:shadow-2xl transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Total Events</CardTitle>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-8 h-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold mb-2">{stats?.total_events || 0}</p>
              <p className="text-blue-100">Active certificate events</p>
            </CardContent>
          </Card>

          {/* Total Certificates */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-2xl transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Total Certificates</CardTitle>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold mb-2">{stats?.total_certificates || 0}</p>
              <p className="text-purple-100">Generated certificates</p>
            </CardContent>
          </Card>

          {/* Average Certificates per Event */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 text-white hover:shadow-2xl transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Avg per Event</CardTitle>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold mb-2">
                {stats?.total_events > 0 
                  ? Math.round(stats.total_certificates / stats.total_events)
                  : 0}
              </p>
              <p className="text-orange-100">Certificates per event</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-100 to-purple-100">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="w-6 h-6 text-violet-600" />
                Recent Events
              </CardTitle>
              <CardDescription>Last 5 events created</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.recent_events?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_events.map((event, index) => {
                    const eventWithCerts = stats.certificates_by_event?.find(e => e.event_slug === event.slug);
                    return (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 text-lg">{event.name}</h4>
                          {eventWithCerts && (
                            <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {eventWithCerts.count} certs
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-violet-600 font-mono mb-1">/{event.slug}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Created: {new Date(event.created_at).toLocaleDateString()}
                        </p>
                        {eventWithCerts && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleExportCertificates(eventWithCerts.event_id, event.name)}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              CSV
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEvent(eventWithCerts.event_id, event.name)}
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No events yet</p>
              )}
            </CardContent>
          </Card>

          {/* Certificates by Event */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-100 to-rose-100">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6 text-pink-600" />
                Certificates by Event
              </CardTitle>
              <CardDescription>Certificate distribution across events</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.certificates_by_event?.length > 0 ? (
                <div className="space-y-3">
                  {stats.certificates_by_event.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 text-lg">{item.event_name}</h4>
                        <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                          {item.count} certs
                        </span>
                      </div>
                      <p className="text-sm text-pink-600 font-mono mb-3">/{item.event_slug}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          data-testid={`export-event-${index}-btn`}
                          size="sm"
                          onClick={() => handleExportCertificates(item.event_id, item.event_name)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download CSV
                        </Button>
                        <Button
                          data-testid={`delete-event-${index}-btn`}
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEvent(item.event_id, item.event_name)}
                          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No certificates generated yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl mt-6">
          <CardHeader className="bg-gradient-to-r from-cyan-100 to-blue-100">
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                data-testid="goto-create-event-btn"
                onClick={() => navigate('/admin')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Create New Event
              </Button>
              <Button
                data-testid="goto-generate-btn"
                onClick={() => navigate('/admin')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
              >
                <Award className="w-5 h-5 mr-2" />
                Generate Certificates
              </Button>
              <Button
                data-testid="goto-home-btn"
                onClick={() => navigate('/')}
                variant="outline"
                className="border-2 border-gray-300 hover:bg-gray-50 py-6 text-lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}