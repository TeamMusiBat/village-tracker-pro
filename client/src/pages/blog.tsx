
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import type { Blog } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronRight, File, Edit, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

export default function Blog() {
  const { user } = useAuth();
  
  // Fetch blogs
  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['/api/blogs']
  });

  // Check if user can create blogs (developer or master)
  const canCreateBlog = user && ['developer', 'master'].includes(user.role);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Health Blogs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Latest health insights and education materials
          </p>
        </div>
        
        {canCreateBlog && (
          <Button asChild>
            <Link href="/blog/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Blog
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : blogs && blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog: Blog) => (
            <Card key={blog.id} className="overflow-hidden flex flex-col">
              {blog.imageUrl && (
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={blog.imageUrl} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{blog.title}</CardTitle>
                  {!blog.publishedAt && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Draft
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  By {blog.author || 'Unknown'} • {formatDate(blog.publishedAt || blog.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {blog.content.substring(0, 150) + '...'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="ghost" asChild>
                  <Link href={`/blog/${blog.id}`}>
                    Read More
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                {canCreateBlog && user?.id === blog.authorId && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/blog/${blog.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No blog posts yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Check back later for health-related articles and updates.
          </p>
          {canCreateBlog && (
            <Button className="mt-4" asChild>
              <Link href="/blog/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Blog
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Health resources section */}
      <div className="mt-16">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Health Resources
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Guide</CardTitle>
              <CardDescription>Essential information about childhood vaccines</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Learn about the importance of timely vaccinations and the recommended schedule for children under 5 years.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Download Guide</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Facts</CardTitle>
              <CardDescription>Understanding MUAC measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Discover how Mid-Upper Arm Circumference helps identify malnutrition and what the measurements mean.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Learn More</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Hygiene Practices</CardTitle>
              <CardDescription>Preventing illness through proper hygiene</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Simple hygiene practices that can significantly reduce the risk of disease in communities.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Resources</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Contact section */}
      <div className="mt-16 text-center py-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Need Help or Have Questions?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
          Our team is available to provide support and answer any questions you might have about health monitoring and awareness.
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
