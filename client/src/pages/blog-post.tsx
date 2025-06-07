import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Calendar, User } from 'lucide-react';
import UserAvatar from '@/components/user-avatar';

export default function BlogPost() {
  const [, params] = useRoute('/blog/:id');
  const { user } = useAuth();
  const blogId = params?.id;

  // Fetch blog
  const { data: blog, isLoading, error } = useQuery({
    queryKey: [`/api/blogs/${blogId}`],
    enabled: !!blogId
  });

  // Check if user can edit this blog
  const canEditBlog = user && (
    ['developer', 'master'].includes(user.role) || 
    (blog && user.id === blog.authorId)
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog Post Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/blog">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/blog">
          <a className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </a>
        </Link>
      </div>

      <article>
        {blog.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img 
              src={blog.imageUrl} 
              alt={blog.title} 
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {blog.title}
        </h1>
        
        <div className="flex items-center mb-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <time dateTime={blog.publishedAt || blog.createdAt}>
              {formatDate(blog.publishedAt || blog.createdAt)}
            </time>
          </div>
          <span className="mx-2">•</span>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span>By {blog.author.fullName}</span>
          </div>
          
          {canEditBlog && (
            <>
              <span className="mx-2">•</span>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                <Link href={`/blog/${blog.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </>
          )}
        </div>
        
        <div className="prose dark:prose-invert max-w-none">
          {/* Blog content - can be rendered as markdown or HTML if needed */}
          {blog.content.split('\n').map((paragraph: string, idx: number) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          About the Author
        </h2>
        
        <div className="flex items-start">
          <UserAvatar 
            user={blog.author}
            size="lg"
            className="mr-4"
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {blog.author.fullName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {blog.author.role === 'developer' ? 'Administrator' : 
               blog.author.role === 'master' ? 'Supervisor' : 
               blog.author.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer'}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {blog.author.bio || `${blog.author.fullName} is a health professional working to improve community health outcomes through the Track4Health program.`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Related posts */}
      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Related Posts
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* This would be populated with related posts in a real implementation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Understanding Child Nutrition</CardTitle>
              <CardDescription>Essential guidelines for healthy growth</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                Proper nutrition during the first five years of life is crucial for healthy development and growth...
              </p>
              <Button variant="link" className="p-0 mt-2" asChild>
                <Link href="/blog/nutrition">Read more</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Immunization Schedule Guide</CardTitle>
              <CardDescription>Keep your children protected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                Following the recommended immunization schedule is one of the most important things parents can do...
              </p>
              <Button variant="link" className="p-0 mt-2" asChild>
                <Link href="/blog/immunization">Read more</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Call to action */}
      <div className="mt-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Have Questions About Your Health?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Our team is ready to assist with any health concerns or questions you might have.
        </p>
        <a
          href="https://wa.me/923032939576"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Contact Support
        </a>
      </div>
    </div>
  );
}
