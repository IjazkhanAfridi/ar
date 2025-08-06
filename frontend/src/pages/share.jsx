import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Copy, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ARViewer } from '@/components/ar-viewer';

export default function Share({ params }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showARViewer, setShowARViewer] = useState(false);

  const { data: experience, isLoading } = useQuery({
    queryKey: [`/api/share/${params.link}`],
  });

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Share link copied to clipboard' });
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='animate-pulse'>
          <CardContent className='h-48' />
        </Card>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='py-8'>
            <h2 className='text-2xl font-bold text-center mb-4'>
              Experience not found
            </h2>
            <p className='text-center text-muted-foreground mb-8'>
              The experience you're looking for doesn't exist or has been
              removed.
            </p>
            <Button className='mx-auto block' onClick={() => navigate('/')}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-8'>
          <Button variant='outline' onClick={() => navigate('/')}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Home
          </Button>
          <Button onClick={copyShareLink}>
            <Copy className='mr-2 h-4 w-4' />
            Copy Share Link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{experience.title}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <p className='text-muted-foreground'>{experience.description}</p>

            <div className='aspect-video bg-muted rounded-lg overflow-hidden'>
              <img
                src={experience.markerImage}
                alt='AR Marker'
                className='w-full h-full object-contain'
              />
            </div>

            <div className='flex justify-center'>
              <Button
                size='lg'
                onClick={() => setShowARViewer(true)}
                disabled={!experience.mindFile}
              >
                <Share2 className='mr-2 h-4 w-4' />
                Start AR Experience
              </Button>
            </div>

            {!experience.mindFile && (
              <p className='text-sm text-muted-foreground text-center'>
                Mind file not yet uploaded. Please upload a mind file to enable
                AR viewing.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {showARViewer && experience.mindFile && (
        <ARViewer
          mindFile={experience.mindFile}
          contentConfig={experience.contentConfig}
          onClose={() => setShowARViewer(false)}
        />
      )}
    </>
  );
}
