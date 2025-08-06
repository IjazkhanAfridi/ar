import { useParams, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Share, ArrowLeft, Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ExperienceDetail() {
  const { id } = useParams();

  const { data: experience, isLoading } = useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      const response = await fetch(`/api/experiences/${id}`);
      if (!response.ok) throw new Error('Failed to fetch experience');
      return response.json();
    },
    enabled: !!id,
  });

  const getMarkerImageUrl = (markerImage, experienceId) => {
    if (markerImage.startsWith('data:image/')) {
      return markerImage;
    }
    return `/api/markers/${experienceId}-marker.png`;
  };

  const handleLaunchViewer = () => {
    if (experience) {
      const experienceUrl = `/experiences/${experience.id}.html`;
      window.open(experienceUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (experience) {
      const shareUrl = `${window.location.origin}/experiences/${experience.id}.html`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: experience.title,
            text: experience.description,
            url: shareUrl,
          });
        } catch (error) {
          console.log('Share cancelled');
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    }
  };

  const downloadMarker = () => {
    if (experience) {
      const link = document.createElement('a');
      link.href = getMarkerImageUrl(experience.markerImage, experience.id);
      link.download = `${experience.title}-marker.png`;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-48 mb-6'></div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='h-96 bg-gray-200 rounded-lg'></div>
            <div className='space-y-4'>
              <div className='h-8 bg-gray-200 rounded w-3/4'></div>
              <div className='h-4 bg-gray-200 rounded w-full'></div>
              <div className='h-4 bg-gray-200 rounded w-2/3'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className='container mx-auto p-6'>
        <div className='text-center py-12'>
          <h2 className='text-xl font-semibold mb-2'>Experience not found</h2>
          <p className='text-muted-foreground mb-4'>
            The experience you're looking for doesn't exist.
          </p>
          <Link href='/experiences'>
            <Button>Back to Experiences</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      {/* Back Button */}
      <Link href='/experiences'>
        <Button variant='ghost' className='mb-6'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Experiences
        </Button>
      </Link>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Marker Image */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Marker Image</CardTitle>
              <CardDescription>
                Point your camera at this image to view the AR experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                <img
                  src={getMarkerImageUrl(experience.markerImage, experience.id)}
                  alt={`${experience.title} marker`}
                  className='w-full h-full object-contain'
                />
              </div>
              <Button
                variant='outline'
                className='w-full mt-4'
                onClick={downloadMarker}
              >
                <Download className='h-4 w-4 mr-2' />
                Download Marker
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Experience Details */}
        <div className='space-y-6'>
          <div>
            <div className='flex items-start gap-2 mb-2'>
              <h1 className='text-3xl font-bold'>{experience.title}</h1>
              <Badge variant='secondary'>AR</Badge>
            </div>
            <p className='text-muted-foreground text-lg'>
              {experience.description}
            </p>
          </div>

          {/* Actions */}
          <div className='flex gap-3'>
            <Button onClick={handleLaunchViewer} size='lg' className='flex-1'>
              <Play className='h-5 w-5 mr-2' />
              Launch AR Experience
            </Button>
            <Button variant='outline' onClick={handleShare}>
              <Share className='h-4 w-4' />
            </Button>
          </div>

          {/* Experience Info */}
          <Card>
            <CardHeader>
              <CardTitle>Experience Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Objects in Scene:</span>
                <span>
                  {experience.contentConfig.sceneObjects?.length || 0}
                </span>
              </div>

              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Experience ID:</span>
                <span className='font-mono text-sm'>{experience.id}</span>
              </div>

              {experience.mindFile && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Tracking File:</span>
                  <Badge variant='outline'>Available</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scene Objects */}
          {experience.contentConfig.sceneObjects &&
            experience.contentConfig.sceneObjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Scene Objects</CardTitle>
                  <CardDescription>
                    Objects that will appear in the AR experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {experience.contentConfig.sceneObjects.map((obj, index) => (
                      <div
                        key={obj.id}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <div>
                          <div className='font-medium'>Object {index + 1}</div>
                          <div className='text-sm text-muted-foreground'>
                            Type: {obj.content.type}
                          </div>
                        </div>
                        <Badge variant='outline'>{obj.content.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex items-start gap-2'>
                <div className='w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold'>
                  1
                </div>
                <p className='text-sm'>
                  Download or view the marker image above
                </p>
              </div>
              <div className='flex items-start gap-2'>
                <div className='w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold'>
                  2
                </div>
                <p className='text-sm'>
                  Click "Launch AR Experience" to open the AR viewer
                </p>
              </div>
              <div className='flex items-start gap-2'>
                <div className='w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold'>
                  3
                </div>
                <p className='text-sm'>
                  Point your camera at the marker to see the AR content
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
