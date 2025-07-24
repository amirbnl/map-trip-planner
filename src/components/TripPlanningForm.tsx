import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Clock, Mail, Phone, User, Navigation, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import TripMapSelector from './TripMapSelector';
import TripSummary from './TripSummary';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  tripDate: z.date({
    required_error: 'Please select a trip date',
  }),
  tripTime: z.string().min(1, 'Please select a trip time'),
  startingAddress: z.string().min(5, 'Starting address is required'),
  endingAddress: z.string().min(5, 'Ending address is required'),
});

export type FormData = z.infer<typeof formSchema>;

export interface Destination {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

const TripPlanningForm = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      tripTime: '',
      startingAddress: '',
      endingAddress: '',
    },
  });

  const tripCost = totalDistance * 1.3;

  const onSubmit = (data: FormData) => {
    const submissionData = {
      ...data,
      destinations,
      totalDistance,
      tripCost,
      submittedAt: new Date().toISOString(),
    };

    console.log('Trip Planning Submission:', JSON.stringify(submissionData, null, 2));
    
    setSubmittedData(submissionData);
    setShowSummary(true);
    
    toast({
      title: "Trip Planned Successfully!",
      description: `Your trip has been planned with ${destinations.length} destinations. Total cost: ${tripCost.toFixed(2)} TND`,
    });
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  if (showSummary && submittedData) {
    return (
      <TripSummary 
        data={submittedData} 
        onBack={() => setShowSummary(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Plan Your Perfect Trip
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your custom itinerary with multiple destinations and get instant cost estimates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Trip Details Form */}
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Trip Details
              </CardTitle>
              <CardDescription>
                Fill in your trip information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+216 XX XXX XXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Trip Timing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tripDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Trip Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tripTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Trip Time
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <option value="">Select time</option>
                              {generateTimeOptions().map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Addresses */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="startingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            Starting Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your starting point" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Ending Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your destination" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Cost Summary */}
                  {totalDistance > 0 && (
                    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-primary" />
                            <span className="font-medium">Trip Cost</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {totalDistance.toFixed(1)} km × 1.3 TND/km
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {tripCost.toFixed(2)} TND
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button type="submit" className="w-full" size="lg">
                    Submit Trip Plan
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Select Destinations
              </CardTitle>
              <CardDescription>
                Click on the map to add waypoints to your trip
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? 'Hide Map' : 'Select Your First Destination'}
                </Button>

                {destinations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Destinations ({destinations.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {destinations.map((dest, index) => (
                        <div
                          key={dest.id}
                          className="flex items-center justify-between p-2 bg-secondary rounded-md"
                        >
                          <span className="text-sm">
                            Destination {index + 1}: {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDestinations(destinations.filter(d => d.id !== dest.id));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showMap && (
                  <TripMapSelector
                    destinations={destinations}
                    onDestinationsChange={setDestinations}
                    startingAddress={form.watch('startingAddress')}
                    endingAddress={form.watch('endingAddress')}
                    onDistanceCalculated={setTotalDistance}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripPlanningForm;