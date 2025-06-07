import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatText, isValidDateFormat } from '@/lib/text-formatter';
import { useOnlineStatus } from '@/hooks/use-online-status';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export type AttendeeFormValues = z.infer<typeof attendeeSchema>;

interface AttendeeFormProps {
  sessionId: number | null;
  onAddAttendee: (attendee: AttendeeFormValues) => Promise<void>;
  checkDuplicate?: (name: string, fatherName: string) => boolean;
  isLoading?: boolean;
}

export default function AttendeeForm({ 
  sessionId, 
  onAddAttendee, 
  checkDuplicate,
  isLoading = false 
}: AttendeeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const [showVaccinationDetails, setShowVaccinationDetails] = useState(false);
  
  // Create refs for input fields we want to clear
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fatherNameInputRef = useRef<HTMLInputElement>(null);

  // Form for attendee data
  const form = useForm<AttendeeFormValues>({
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
  const childrenUnderFive = form.watch('childrenUnderFive');
  
  useEffect(() => {
    // Ensure we handle the comparison correctly for string or number values
    const hasChildren = childrenUnderFive !== null && 
                        childrenUnderFive !== undefined && 
                        childrenUnderFive !== '' && 
                        Number(childrenUnderFive) > 0;
    setShowVaccinationDetails(hasChildren);
  }, [childrenUnderFive]);

  // Submit handler for the form
  const onSubmit = async (data: AttendeeFormValues) => {
    if (!sessionId) {
      toast({
        variant: 'destructive',
        title: 'Session not created',
        description: 'Please create a session first before adding attendees.'
      });
      return;
    }

    // Check for duplicates if the function is provided
    if (checkDuplicate && checkDuplicate(data.name, data.fatherOrHusbandName)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Attendee',
        description: 'This attendee has already been added.'
      });
      return;
    }

    try {
      await onAddAttendee(data);
      
      // Reset only the name and father/husband name fields
      if (nameInputRef.current) nameInputRef.current.value = '';
      if (fatherNameInputRef.current) fatherNameInputRef.current.value = '';
      
      form.setValue('name', '');
      form.setValue('fatherOrHusbandName', '');
      
      toast({
        title: 'Attendee added successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add attendee',
        description: error.message || 'An error occurred while adding the attendee.'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Attendee</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Full Name"
                        disabled={isLoading}
                        ref={nameInputRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatherOrHusbandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father/Husband Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Father/Husband Name"
                        disabled={isLoading}
                        ref={fatherNameInputRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
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
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
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
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="childrenUnderFive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Children Under Five</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        placeholder="Number of children under 5"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Contact Number"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showVaccinationDetails && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vaccinationStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaccination Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0 - Dose">0 - Dose</SelectItem>
                          <SelectItem value="1 - Dose">1 - Dose</SelectItem>
                          <SelectItem value="2 - Dose">2 - Dose</SelectItem>
                          <SelectItem value="3 - Dose">3 - Dose</SelectItem>
                          <SelectItem value="4 - Dose">4 - Dose</SelectItem>
                          <SelectItem value="5 - Dose">5 - Dose</SelectItem>
                          <SelectItem value="Complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vaccineDue"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Vaccine Due</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Any additional remarks"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="belongsToSameAddress"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Belongs to same UC</FormLabel>
                  </div>
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
  );
}