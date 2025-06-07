import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { formatText, isValidDateFormat } from '@/lib/text-formatter';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import LocationInput from '@/components/location-input';
import DuplicateEntryAlert from '@/components/duplicate-entry-alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AttendeeForm, { AttendeeFormValues } from '@/components/attendee-form';
import PendingAttendeesList from '@/components/pending-attendees-list';

// Schema for the main session info
const sessionSchema = z.object({
  villageName: z.string().min(1, 'Village name is required'),
  ucName: z.string().min(1, 'UC name is required'),
  latitude: z.number().nullable(),
  longitude: z.number().nullable()
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export default function AwarenessSessionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [currentAttendee, setCurrentAttendee] = useState<AttendeeFormValues | null>(null);
  const [pendingAttendees, setPendingAttendees] = useLocalStorage<any[]>('pending_attendees', []);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isSessionSubmitted, setIsSessionSubmitted] = useState(false);

  // Form for session data
  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      villageName: '',
      ucName: '',
      latitude: null,
      longitude: null
    }
  });
  
  // Create a session
  const createSession = async (data: SessionFormValues) => {
    setIsLoading(true);
    
    try {
      // Format text inputs
      const formattedData = {
        ...data,
        villageName: formatText(data.villageName),
        ucName: formatText(data.ucName),
        conductedBy: user?.fullName || '',
        designation: user?.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer',
        userId: user?.id
      };
      
      // If offline, store data locally
      if (!isOnline) {
        const tempSessionId = Date.now(); // Use timestamp as temporary ID
        setSessionId(tempSessionId);
        
        // Store session data in local storage
        const pendingSessions = JSON.parse(localStorage.getItem('pending_sessions') || '[]');
        pendingSessions.push({
          ...formattedData,
          id: tempSessionId,
          date: new Date().toISOString()
        });
        localStorage.setItem('pending_sessions', JSON.stringify(pendingSessions));
        
        toast({
          title: 'Session saved offline',
          description: 'Session data will be synced when you are back online.',
        });
        
        setIsSessionSubmitted(true);
        return tempSessionId;
      }
      
      // If online, submit to server
      const res = await apiRequest('POST', '/api/awareness-sessions', formattedData);
      const sessionData = await res.json();
      
      toast({
        title: 'Session created successfully',
        description: 'You can now add attendees to this session.',
      });
      
      setIsSessionSubmitted(true);
      setSessionId(sessionData.id);
      return sessionData.id;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create session',
        description: error.message || 'An error occurred while creating the session.'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit the session if not already submitted
  const submitSession = async () => {
    if (!isSessionSubmitted) {
      const data = sessionForm.getValues();
      return await createSession(data);
    }
    return sessionId;
  };

  // Check for duplicates
  const checkDuplicateAttendee = (name: string, fatherName: string): boolean => {
    return attendees.some(attendee => 
      formatText(attendee.name) === formatText(name) && 
      formatText(attendee.fatherOrHusbandName) === formatText(fatherName)
    );
  };

  // Submit attendee data after checks
  const submitAttendeeData = async (data: AttendeeFormValues) => {
    setIsLoading(true);
    
    // Ensure we have a session ID first
    const newSessionId = await submitSession();
    
    if (!newSessionId) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Format text inputs
      const formattedData = {
        ...data,
        name: formatText(data.name),
        fatherOrHusbandName: formatText(data.fatherOrHusbandName),
        sessionId: newSessionId
      };
      
      // If offline, store data locally
      if (!isOnline) {
        const tempId = Date.now(); // Use timestamp as temporary ID
        
        // Add to pending attendees
        const newPendingAttendee = {
          ...formattedData,
          id: tempId,
          createdAt: new Date().toISOString()
        };
        
        setPendingAttendees([...pendingAttendees, newPendingAttendee]);
        
        // Update local display
        setAttendees([...attendees, newPendingAttendee]);
        
        toast({
          title: 'Attendee saved offline',
          description: 'Attendee data will be synced when you are back online.',
        });
      } else {
        // If online, submit to server
        const res = await apiRequest('POST', '/api/attendees', formattedData);
        const responseData = await res.json();
        
        // Update local display
        setAttendees([...attendees, responseData]);
        
        // Invalidate attendees query
        queryClient.invalidateQueries({ queryKey: [`/api/attendees/session/${newSessionId}`] });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add attendee',
        description: error.message || 'An error occurred while adding the attendee.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for the main session form
  const onSubmitSession = async (data: SessionFormValues) => {
    await createSession(data);
  };

  // Handle location change
  const handleLocationChange = (latitude: number | null, longitude: number | null) => {
    sessionForm.setValue('latitude', latitude);
    sessionForm.setValue('longitude', longitude);
  };

  // Handle removing an attendee (optional feature)
  const handleRemoveAttendee = (id: number | string) => {
    setAttendees(attendees.filter(a => a.id !== id));
    setPendingAttendees(pendingAttendees.filter(a => a.id !== id));
    
    toast({
      title: 'Attendee removed',
      description: 'The attendee has been removed from the list.',
    });
  };

  // Handle forced submission of a duplicate
  const handleForceSubmit = async (attendee: AttendeeFormValues) => {
    await submitAttendeeData(attendee);
    setIsDuplicateWarningOpen(false);
    setCurrentAttendee(null);
  };

  return (
    <div className="space-y-6">
      {/* Session Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(onSubmitSession)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={sessionForm.control}
                  name="villageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Village Name"
                          disabled={isSessionSubmitted || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sessionForm.control}
                  name="ucName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UC Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="UC Name"
                          disabled={isSessionSubmitted || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormItem>
                  <FormLabel>Conducted By</FormLabel>
                  <Input
                    value={user?.fullName || ''}
                    disabled
                  />
                </FormItem>

                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <Input
                    value={user?.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer'}
                    disabled
                  />
                </FormItem>
              </div>

              <FormItem>
                <FormLabel>Location</FormLabel>
                <LocationInput
                  onLocationChange={handleLocationChange}
                  initialLatitude={sessionForm.getValues('latitude')}
                  initialLongitude={sessionForm.getValues('longitude')}
                />
                <FormMessage />
              </FormItem>

              {!isSessionSubmitted && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4"
                >
                  {isLoading ? 'Creating Session...' : 'Create Session'}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Attendee Form - Only show if session is submitted */}
      {isSessionSubmitted && (
        <AttendeeForm 
          sessionId={sessionId}
          onAddAttendee={submitAttendeeData}
          checkDuplicate={checkDuplicateAttendee}
          isLoading={isLoading}
        />
      )}

      {/* Display added attendees */}
      {isSessionSubmitted && attendees.length > 0 && (
        <PendingAttendeesList 
          attendees={attendees}
          onDelete={handleRemoveAttendee}
        />
      )}

      {/* Duplicate Entry Alert */}
      <DuplicateEntryAlert
        isOpen={isDuplicateWarningOpen}
        onClose={() => setIsDuplicateWarningOpen(false)}
        onEdit={() => {
          setIsDuplicateWarningOpen(false);
          toast({
            title: 'Edit mode',
            description: 'Please find and edit the existing entry',
          });
        }}
        onForceSubmit={() => {
          if (currentAttendee) {
            handleForceSubmit(currentAttendee);
          }
        }}
        duplicateType="attendee"
      />
    </div>
  );
}