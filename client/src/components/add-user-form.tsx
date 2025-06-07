import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const addUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['master', 'fmt', 'sm']),
  district: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional()
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function AddUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Determine available roles based on current user role
  const availableRoles = () => {
    if (user?.role === 'developer') {
      return [
        { value: 'master', label: 'Master' },
        { value: 'fmt', label: 'Field Monitor (FMT)' },
        { value: 'sm', label: 'Social Mobilizer (SM)' }
      ];
    } else if (user?.role === 'master') {
      return [
        { value: 'fmt', label: 'Field Monitor (FMT)' },
        { value: 'sm', label: 'Social Mobilizer (SM)' }
      ];
    }
    return [];
  };

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      role: user?.role === 'developer' ? 'master' : 'fmt',
      district: '',
      email: '',
      phoneNumber: ''
    }
  });

  async function onSubmit(data: AddUserFormValues) {
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/users', data);
      
      // Invalidate users query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: 'User created successfully',
        description: `${data.fullName} has been added as a ${data.role}.`,
      });
      
      // Reset form
      form.reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create user',
        description: error.message || 'An error occurred while creating the user.'
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Username"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Password"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
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
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableRoles().map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="District (Optional)"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Email (Optional)"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Phone Number (Optional)"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating User...
              </div>
            ) : (
              'Create User'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
