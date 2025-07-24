import React from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation, 
  Route,
  Calculator,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface TripSummaryProps {
  data: {
    fullName: string;
    email: string;
    phone: string;
    tripDate: Date;
    tripTime: string;
    startingAddress: string;
    endingAddress: string;
    destinations: Array<{
      id: string;
      lat: number;
      lng: number;
      name?: string;
    }>;
    totalDistance: number;
    tripCost: number;
    submittedAt: string;
  };
  onBack: () => void;
}

const TripSummary: React.FC<TripSummaryProps> = ({ data, onBack }) => {
  const downloadSummary = () => {
    const summaryText = `
TRIP PLANNING SUMMARY
====================

Personal Information:
- Name: ${data.fullName}
- Email: ${data.email}
- Phone: ${data.phone}

Trip Details:
- Date: ${format(new Date(data.tripDate), 'PPP')}
- Time: ${data.tripTime}
- Starting Address: ${data.startingAddress}
- Ending Address: ${data.endingAddress}

Destinations (${data.destinations.length}):
${data.destinations.map((dest, index) => 
  `${index + 1}. Lat: ${dest.lat.toFixed(4)}, Lng: ${dest.lng.toFixed(4)}`
).join('\n')}

Cost Summary:
- Total Distance: ${data.totalDistance.toFixed(2)} km
- Rate: 1.3 TND per km
- Total Cost: ${data.tripCost.toFixed(2)} TND

Submitted: ${format(new Date(data.submittedAt), 'PPP pp')}
    `;

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-summary-${data.fullName.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-success rounded-full">
              <Check className="h-8 w-8 text-success-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent mb-4">
            Trip Planned Successfully!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your trip has been planned and submitted. Here's your complete itinerary summary.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Plan Another Trip
            </Button>
            <Button
              onClick={downloadSummary}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Download Summary
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{data.fullName}</div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{data.email}</div>
                    <div className="text-sm text-muted-foreground">Email Address</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{data.phone}</div>
                    <div className="text-sm text-muted-foreground">Phone Number</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Schedule */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Trip Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {format(new Date(data.tripDate), 'EEEE, MMMM do, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">Trip Date</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{data.tripTime}</div>
                    <div className="text-sm text-muted-foreground">Departure Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Details */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Starting Point */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-success/10 rounded-full">
                    <Navigation className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Starting Point</div>
                    <div className="text-muted-foreground">{data.startingAddress}</div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success">Start</Badge>
                </div>

                {/* Destinations */}
                {data.destinations.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">Waypoints ({data.destinations.length})</span>
                      </div>
                      <div className="space-y-3 ml-6">
                        {data.destinations.map((dest, index) => (
                          <div key={dest.id} className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                {dest.name || `Destination ${index + 1}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Ending Point */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <MapPin className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Final Destination</div>
                    <div className="text-muted-foreground">{data.endingAddress}</div>
                  </div>
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">End</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-accent/5 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {data.totalDistance.toFixed(1)} km
                    </div>
                    <div className="text-sm text-muted-foreground">Total Distance</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      1.3 TND/km
                    </div>
                    <div className="text-sm text-muted-foreground">Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {data.tripCost.toFixed(2)} TND
                    </div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-center text-sm text-muted-foreground">
                  Calculation: {data.totalDistance.toFixed(2)} km × 1.3 TND/km = {data.tripCost.toFixed(2)} TND
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Info */}
          <Card className="mt-6 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center text-sm text-muted-foreground">
                Trip submitted on {format(new Date(data.submittedAt), 'PPP pp')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripSummary;