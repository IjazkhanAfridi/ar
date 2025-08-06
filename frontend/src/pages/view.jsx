import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { ARViewer } from '@/components/ar-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

export default function View() {
  const { link } = useParams();
  const [showAR, setShowAR] = useState(false);

  const { data: experience, isLoading } = useQuery({
    queryKey: [`/api/share/${link}`],
  });

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='animate-pulse'>
          <CardContent className='h-96' />
        </Card>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='p-6 text-center'>
            <h2 className='text-2xl font-bold mb-4'>Experience not found</h2>
            <p className='text-muted-foreground'>
              The experience you're looking for doesn't exist or has been
              removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='p-6'>
            <h1 className='text-3xl font-bold mb-4'>{experience.title}</h1>
            <p className='text-muted-foreground mb-6'>
              {experience.description}
            </p>

            <div className='mb-6'>
              <img
                src={experience.markerImage}
                alt='AR Marker'
                className='max-w-sm mx-auto'
              />
              <p className='text-sm text-center mt-2 text-muted-foreground'>
                Point your camera at this image to see the AR experience
              </p>
            </div>

            <Button className='w-full' onClick={() => setShowAR(true)}>
              <Camera className='mr-2 h-4 w-4' />
              Launch Viewer
            </Button>
          </CardContent>
        </Card>
      </div>

      {showAR && (
        <ARViewer
          markerImage={experience.markerImage}
          contentConfig={experience.contentConfig}
          onClose={() => setShowAR(false)}
        />
      )}
    </>
  );
}
