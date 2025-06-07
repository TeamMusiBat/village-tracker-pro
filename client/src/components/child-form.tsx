import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatText, isValidDateFormat } from '@/lib/text-formatter';
import { getNutritionStatus } from '@/lib/utils';
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

// Schema for child entry
const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  ageMonths: z.number().min(1, 'Age is required').nullable().or(z.literal('')),
  dateOfBirth: z.string().refine(val => !val || isValidDateFormat(val), {
    message: 'Date of birth must be in DD/MM/YYYY format'
  }),
  gender: z.enum(['Male', 'Female']),
  muac: z.number().min(1, 'MUAC is required').nullable().or(z.literal('')),
  weight: z.number().min(0.1, 'Weight is required').nullable().or(z.literal('')),
  height: z.number().min(1, 'Height is required').nullable().or(z.literal('')),
  nutritionStatus: z.enum(['Normal', 'MAM', 'SAM']),
  vaccinationStatus: z.string(),
  vaccineDue: z.boolean().default(false),
  belongsToSameAddress: z.boolean().default(false)
});

export type ChildFormValues = z.infer<typeof childSchema>;

interface ChildFormProps {
  screeningId: number | null;
  onAddChild: (child: ChildFormValues) => Promise<void>;
  checkDuplicate?: (name: string, fatherName: string) => boolean;
  isLoading?: boolean;
}

export default function ChildForm({ 
  screeningId, 
  onAddChild, 
  checkDuplicate,
  isLoading = false 
}: ChildFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  
  // Create refs for input fields we want to clear
  const childNameInputRef = useRef<HTMLInputElement>(null);
  const fatherNameInputRef = useRef<HTMLInputElement>(null);

  // Form for child data
  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      childName: '',
      fatherName: '',
      ageMonths: null,
      dateOfBirth: '',
      gender: 'Male',
      muac: null,
      weight: null,
      height: null,
      nutritionStatus: 'Normal',
      vaccinationStatus: '0 - Dose',
      vaccineDue: false,
      belongsToSameAddress: false
    }
  });

  // Watch MUAC to auto-calculate nutrition status
  const muac = form.watch('muac');
  
  useEffect(() => {
    if (muac !== null && muac !== '') {
      const status = getNutritionStatus(Number(muac));
      form.setValue('nutritionStatus', status);
    }
  }, [muac, form]);

  // Submit handler for the form
  const onSubmit = async (data: ChildFormValues) => {
    if (!screeningId) {
      toast({
        variant: 'destructive',
        title: 'Screening not created',
        description: 'Please create a screening first before adding children.'
      });
      return;
    }

    // Check for duplicates if the function is provided
    if (checkDuplicate && checkDuplicate(data.childName, data.fatherName)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Child',
        description: 'This child has already been added.'
      });
      return;
    }

    try {
      await onAddChild(data);
      
      // Reset only the child name and father name fields
      if (childNameInputRef.current) childNameInputRef.current.value = '';
      if (fatherNameInputRef.current) fatherNameInputRef.current.value = '';
      
      form.setValue('childName', '');
      form.setValue('fatherName', '');
      
      toast({
        title: 'Child added successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add child',
        description: error.message || 'An error occurred while adding the child.'
      });
    }
  };
  
  // Get MUAC status class for styling
  const getMuacClass = () => {
    if (!muac) return '';
    const numMuac = Number(muac);
    if (numMuac < 11.5) return 'bg-red-100 border-red-300';
    if (numMuac >= 11.5 && numMuac < 12.5) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Child</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="childName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Child Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Child Name"
                        disabled={isLoading}
                        ref={childNameInputRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Father Name"
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
                name="ageMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        placeholder="Age in months"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="muac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MUAC (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        placeholder="MUAC in cm"
                        disabled={isLoading}
                        className={getMuacClass()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        placeholder="Weight in kg"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        placeholder="Height in cm"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nutritionStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nutrition Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className={
                          field.value === 'SAM' ? 'bg-red-100 border-red-300' :
                          field.value === 'MAM' ? 'bg-yellow-100 border-yellow-300' :
                          'bg-green-100 border-green-300'
                        }>
                          <SelectValue placeholder="Nutrition Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="MAM">MAM</SelectItem>
                        <SelectItem value="SAM">SAM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-4"
            >
              {isLoading ? 'Adding Child...' : 'Add Child'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}