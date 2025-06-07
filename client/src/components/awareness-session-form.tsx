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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import LocationInput from '@/components/location-input';
import DuplicateEntryAlert from '@/components/duplicate-entry-alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Schema for the main session info
const sessionSchema = z.object({
  villageName: z.string().min(1, 'Village name is required'),
  ucName: z.string().min(1, 'UC name is required'),
  latitude: z.number().nullable(),
  longitude: z.number().nullable()
});

// Schema for attendee entry
const attendeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fatherOrHusbandName: z.string().min(1, 'Father/Husband name is required'),
  ageYears: z.number().min(1, 'Age is required').nullable().or(z.literal('')),
  dateOfBirth: z.string().refine(val => !val || isValidDateFormat(val), {
    message: 'Date of birth must be in DD/MM/YYYY format'
  }),
  gender: z.enum(['Male', 'Female']).default('Male'),
  childrenUnderFive: z.number().int().min(0).nullable().or(z.literal('')),
  contactNumber: z.string().optional(),
  remarks: z.string().optional(),
  vaccinationStatus: z.string().optional(),
  vaccineDue: z.boolean().default(false),
  vaccineCardImage: z.string().optional(),
  belongsToSameAddress: z.boolean().default(false),
  images: z.array(z.string()).default([])
});

type SessionFormValues = z.infer<typeof sessionSchema>;
type AttendeeFormValues = z.infer<typeof attendeeSchema>;

export default function AwarenessSessionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [showVaccinationDetails, setShowVaccinationDetails] = useState(false);
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

  // Form for attendee data
  const attendeeForm = useForm<AttendeeFormValues>({
    resolver: zodResolver(attendeeSchema),
    defaultValues: {
      name: '',
      fatherOrHusbandName: '',
      ageYears: null,
      dateOfBirth: '',
      gender: 'Male',
      childrenUnderFive: 0,
      contactNumber: '',
      remarks: '',
      vaccinationStatus: '0 - Dose',
      vaccineDue: false,
      vaccineCardImage: '',
      belongsToSameAddress: false,
      images: []
    }
  });

  // Watch for changes in children under five to show/hide vaccination details
  const childrenUnderFive = attendeeForm.watch('childrenUnderFive');
  
  useEffect(() => {
    // Ensure we handle the comparison correctly for string or number values
    const hasChildren = childrenUnderFive !== null && 
                        childrenUnderFive !== undefined && 
                        childrenUnderFive !== '' && 
                        Number(childrenUnderFive) > 0;
    setShowVaccinationDetails(hasChildren);
  }, [childrenUnderFive]);
  
  // Create a session
  const createSession = async (data: SessionFormValues) => {
    setIsLoading(true);
    
    try {
      // Format text inputs
      const formattedData = {
        ...data,
        villageName: formatText(data.villageName),
        ucName: formatText(data.ucName),
        conductedBy: user?.fullName || user?.name || '',
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

  // Add an attendee
  const addAttendee = async (data: AttendeeFormValues) => {
    // Check for duplicates
    const isDuplicate = attendees.some(attendee => 
      formatText(attendee.name) === formatText(data.name) && 
      formatText(attendee.fatherOrHusbandName) === formatText(data.fatherOrHusbandName)
    );
    
    if (isDuplicate) {
      setCurrentAttendee(data);
      setIsDuplicateWarningOpen(true);
      return;
    }
    
    await submitAttendeeData(data);
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
      
      // Reset attendee form - name and father name only
      attendeeForm.setValue('name', '');
      attendeeForm.setValue('fatherOrHusbandName', '');
      
      toast({
        title: 'Attendee added successfully',
      });
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

  // Handle form submission
  const onSubmitSession = async (data: SessionFormValues) => {
    await createSession(data);
  };

  const onSubmitAttendee = async (data: AttendeeFormValues) => {
    await addAttendee(data);
  };

  // Handle location change
  const handleLocationChange = (latitude: number | null, longitude: number | null) => {
    sessionForm.setValue('latitude', latitude);
    sessionForm.setValue('longitude', longitude);
  };

  // Handle closing the duplicate warning
  const handleCloseDuplicateWarning = () => {
    setIsDuplicateWarningOpen(false);
    setCurrentAttendee(null);
  };

  // Handle editing existing attendee instead
  const handleEditExisting = () => {
    handleCloseDuplicateWarning();
    // Implement edit functionality
    toast({
      title: 'Edit mode',
      description: 'Please find and edit the existing entry',
    });
  };

  // Handle force submitting the duplicate
  const handleForceSubmit = () => {
    if (currentAttendee) {
      submitAttendeeData(currentAttendee);
    }
    handleCloseDuplicateWarning();
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
                    value={user?.fullName || user?.name || ''}
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
        <Card>
          <CardHeader>
            <CardTitle>Add Attendee</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...attendeeForm}>
              <form onSubmit={attendeeForm.handleSubmit(onSubmitAttendee)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={attendeeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Full Name"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={attendeeForm.control}
                    name="fatherOrHusbandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father/Husband Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Father/Husband Name"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={attendeeForm.control}
                    name="ageYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (Years)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                            placeholder="Age in years"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={attendeeForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="DD/MM/YYYY"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={attendeeForm.control}
                    name="childrenUnderFive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Children (Under 5 Years)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                            placeholder="Number of children"
                            min={0}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={attendeeForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={attendeeForm.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Phone Number"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={attendeeForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Additional notes"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {showVaccinationDetails && (
                  <div className="border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-sm font-medium mb-3">Vaccination Status</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={attendeeForm.control}
                        name="vaccinationStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vaccination status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0 - Dose">0 - Dose</SelectItem>
                                  <SelectItem value="1st - Dose">1st - Dose</SelectItem>
                                  <SelectItem value="2nd - Dose">2nd - Dose</SelectItem>
                                  <SelectItem value="3rd - Dose">3rd - Dose</SelectItem>
                                  <SelectItem value="MR - 1">MR - 1</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={attendeeForm.control}
                        name="vaccineDue"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Vaccine Due
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <FormField
                  control={attendeeForm.control}
                  name="belongsToSameAddress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Person Belongs From Same Address
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4"
                >
                  {isLoading ? 'Adding Attendee...' : 'Add Attendee'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Attendees List */}
      {attendees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendees List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Father/Husband</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Children Under 5</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vaccination</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {attendees.map((attendee, index) => (
                    <tr key={attendee.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{attendee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{attendee.fatherOrHusbandName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{attendee.ageYears}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{attendee.childrenUnderFive}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{attendee.vaccinationStatus}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                          onClick={() => {
                            // Edit functionality
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => {
                            // Delete functionality
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Entry Alert */}
      <DuplicateEntryAlert
        isOpen={isDuplicateWarningOpen}
        onClose={handleCloseDuplicateWarning}
        onEdit={handleEditExisting}
        onForceSubmit={handleForceSubmit}
        duplicateType="attendee"
      />
    </div>
  );
}
