import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, FileText, MousePointer, ArrowLeft, Download, BarChart3, Copy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Load saved form data from localStorage
const loadFormData = () => {
  const saved = localStorage.getItem('certificateFormData');
  return saved ? JSON.parse(saved) : {
    fontSize: 60,
    fontColor: '#000000'
  };
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [certificates, setCertificates] = useState([]);
  
  // New event form with localStorage persistence
  const savedData = loadFormData();
  const [eventName, setEventName] = useState('');
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(savedData.fontSize);
  const [fontColor, setFontColor] = useState(savedData.fontColor);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('certificateFormData', JSON.stringify({
      fontSize,
      fontColor
    }));
  }, [fontSize, fontColor]);
  
  // CSV upload
  const [csvFile, setCsvFile] = useState(null);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchCertificates(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to fetch events');
    }
  };

  const fetchCertificates = async (eventId) => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/certificates`);
      setCertificates(response.data);
    } catch (error) {
      toast.error('Failed to fetch certificates');
    }
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTemplateFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    
    setTextPosition({ x, y });
    toast.success(`Position set: (${x}, ${y})`);
  };

  const handleCreateEvent = async () => {
    if (!eventName || !templateFile || textPosition.x === 0) {
      toast.error('Please fill all fields and select text position');
      return;
    }

    const formData = new FormData();
    formData.append('name', eventName);
    formData.append('template', templateFile);
    formData.append('text_position_x', textPosition.x);
    formData.append('text_position_y', textPosition.y);
    formData.append('font_size', fontSize);
    formData.append('font_color', fontColor);

    try {
      await axios.post(`${API}/events`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Event created successfully!');
      setEventName('');
      setTemplateFile(null);
      setTemplatePreview(null);
      setTextPosition({ x: 0, y: 0 });
      setShowPositionPicker(false);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedEvent || !csvFile) {
      toast.error('Please select an event and upload CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', csvFile);

    try {
      const response = await axios.post(
        `${API}/events/${selectedEvent.id}/generate`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      toast.success(`Generated ${response.data.generated} certificates!`);
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} errors occurred`);
      }
      
      setCsvFile(null);
      fetchCertificates(selectedEvent.id);
    } catch (error) {
      toast.error('Failed to generate certificates');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            data-testid="back-to-home-btn"
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-2">Create events and generate certificates</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="create" data-testid="create-event-tab">Create Event</TabsTrigger>
            <TabsTrigger value="generate" data-testid="generate-certificates-tab">Generate Certificates</TabsTrigger>
            <TabsTrigger value="view" data-testid="view-certificates-tab">View Certificates</TabsTrigger>
          </TabsList>

          {/* Create Event Tab */}
          <TabsContent value="create">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle>Create New Event</CardTitle>
                <CardDescription>Upload template and configure certificate settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    data-testid="event-name-input"
                    placeholder="e.g., Annual Conference 2025"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Certificate Template (PNG/JPEG)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="template"
                      data-testid="template-upload-input"
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleTemplateUpload}
                      className="border-gray-300"
                    />
                    {templateFile && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {templateFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {templatePreview && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Input
                          id="fontSize"
                          data-testid="font-size-input"
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value))}
                          className="border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fontColor">Font Color</Label>
                        <Input
                          id="fontColor"
                          data-testid="font-color-input"
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="border-gray-300 h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Position</Label>
                      <Button
                        data-testid="select-position-btn"
                        onClick={() => setShowPositionPicker(!showPositionPicker)}
                        variant="outline"
                        className="w-full"
                      >
                        <MousePointer className="w-4 h-4 mr-2" />
                        {textPosition.x > 0 ? `Position: (${textPosition.x}, ${textPosition.y})` : 'Click to Select Position'}
                      </Button>
                    </div>

                    {showPositionPicker && (
                      <div className="border-4 border-blue-500 rounded-lg p-2 bg-white">
                        <p className="text-sm text-blue-600 mb-2 font-semibold">Click on the template where you want the name to appear:</p>
                        <div className="relative inline-block">
                          <img
                            ref={imageRef}
                            src={templatePreview}
                            alt="Template"
                            className="max-w-full h-auto cursor-crosshair rounded"
                            onClick={handleCanvasClick}
                          />
                          {textPosition.x > 0 && (
                            <div
                              className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: `${(textPosition.x / imageRef.current.naturalWidth) * 100}%`,
                                top: `${(textPosition.y / imageRef.current.naturalHeight) * 100}%`
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  data-testid="create-event-btn"
                  onClick={handleCreateEvent}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Certificates Tab */}
          <TabsContent value="generate">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle>Generate Certificates</CardTitle>
                <CardDescription>Upload CSV file with names and emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  <select
                    data-testid="event-select"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const event = events.find(ev => ev.id === e.target.value);
                      setSelectedEvent(event);
                    }}
                  >
                    <option value="">-- Select Event --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>

                {selectedEvent && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">CSV Format Required:</h3>
                      <code className="text-sm bg-white p-2 rounded block">
                        name,email<br />
                        John Doe,john@example.com<br />
                        Jane Smith,jane@example.com
                      </code>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="csvFile">Upload CSV File</Label>
                      <Input
                        id="csvFile"
                        data-testid="csv-upload-input"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files[0])}
                        className="border-gray-300"
                      />
                    </div>

                    <Button
                      data-testid="generate-btn"
                      onClick={handleGenerateCertificates}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
                      disabled={!csvFile}
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Certificates
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* View Certificates Tab */}
          <TabsContent value="view">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                <CardTitle>View Generated Certificates</CardTitle>
                <CardDescription>Browse all generated certificates for selected event</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Label>Select Event</Label>
                  <select
                    data-testid="view-event-select"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const event = events.find(ev => ev.id === e.target.value);
                      setSelectedEvent(event);
                    }}
                  >
                    <option value="">-- Select Event --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Total Certificates: {certificates.length}</h3>
                        <Button
                          data-testid="share-link-btn"
                          variant="outline"
                          onClick={() => {
                            const link = `${window.location.origin}/download/${selectedEvent.id}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Download link copied to clipboard!');
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Copy Download Link
                        </Button>
                      </div>
                      
                      <div className="grid gap-3 max-h-96 overflow-y-auto">
                        {certificates.map(cert => (
                          <div key={cert.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                              <p className="font-semibold text-gray-800">{cert.name}</p>
                              <p className="text-sm text-gray-500">{cert.email}</p>
                            </div>
                            <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">Generated</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}