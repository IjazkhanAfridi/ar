import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL, buildApiUrl } from '@/utils/config.js';
import { Input } from '@/components/ui/input';
import { Play, Share, Eye, Search, Filter, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Experiences() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/api/experiences'), {
        credentials: 'include', // Important for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch experiences');
      const result = await response.json();
      return result.data?.experiences || result.experiences || [];
    },
  });

  const getMarkerImageUrl = (markerImage, experienceId) => {
    if (markerImage && markerImage.startsWith('data:image/')) {
      return markerImage;
    }
    return `${API_BASE_URL}/api/experiences/markers/${experienceId}.png`;
  };

  const handleEditExperience = (experience) => {
    console.log('Navigating to edit experience:', experience.id);
    navigate(`/edit-experience/${experience.id}`);
  };

  const handleLaunchViewer = (experience) => {
    const experienceUrl = `${API_BASE_URL}/experiences/${experience.id}.html`;
    window.open(experienceUrl, '_blank');
  };

  const handleShare = async (experience) => {
    const shareUrl = `${API_BASE_URL}/experiences/${experience.id}.html`;

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
  };

  const handleViewExperience = (experience) => {
    const experienceUrl = `${API_BASE_URL}/experiences/${experience.id}.html`;
    const params = new URLSearchParams({
      experienceUrl,
      projectNumber: experience.title,
    });

    window.location.href = `/ar-success?${params.toString()}`;
  };

  // Filter and sort experiences
  const filteredExperiences =
    experiences
      ?.filter(
        (exp) =>
          exp?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      ?.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return (b?.id || 0) - (a?.id || 0);
          case 'oldest':
            return (a?.id || 0) - (b?.id || 0);
          case 'title':
            return (a?.title || '').localeCompare(b?.title || '');
          default:
            return 0;
        }
      }) || [];

  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-900 p-6'>
        <div className='container mx-auto'>
          <div className='mb-8'>
            <div className='h-8 bg-gray-700 rounded w-48 mb-2 animate-pulse'></div>
            <div className='h-4 bg-gray-700 rounded w-64 animate-pulse'></div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className='animate-pulse bg-slate-800 border-slate-700'>
                <div className='h-48 bg-gray-700 rounded-t-lg'></div>
                <CardHeader>
                  <div className='h-4 bg-gray-700 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-700 rounded w-1/2'></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900 p-6'>
      <div className='container mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2 text-white'>AR Experiences</h1>
          <p className='text-slate-400'>
            Explore all available augmented reality experiences
          </p>
        </div>

        {/* Filters and Search */}
        <div className='flex flex-col md:flex-row gap-4 mb-8'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4' />
            <Input
              placeholder='Search experiences...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400'
            />
          </div>

          <div className='flex gap-2'>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className='px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-white'
            >
              <option value='newest'>Newest First</option>
              <option value='oldest'>Oldest First</option>
              <option value='title'>Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className='mb-6'>
        <p className='text-sm text-slate-400'>
          {filteredExperiences.length} experience
          {filteredExperiences.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Experiences Grid */}
      {filteredExperiences.length === 0 ? (
        <div className='text-center py-12'>
          <h2 className='text-xl font-semibold mb-2 text-white'>
            {searchTerm ? 'No experiences found' : 'No experiences yet'}
          </h2>
          <p className='text-slate-400 mb-4'>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first AR experience to get started'}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => (window.location.href = '/create')}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              Create Experience
            </Button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredExperiences.map((experience) => (
            <Card
              key={experience.id}
              className='overflow-hidden bg-slate-800 border-slate-700 hover:shadow-lg transition-shadow'
            >
              <div className='aspect-video bg-slate-800 relative overflow-hidden'>
                <img
                  src={getMarkerImageUrl(experience.markerImage, experience.id)}
                  alt={experience.title}
                  className='w-full h-full object-cover bg-slate-700'
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BUiBFeHBlcmllbmNlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <div className='absolute top-2 right-2'>
                  <Badge
                    variant='secondary'
                    className='bg-slate-800 text-white border-0'
                  >
                    AR
                  </Badge>
                </div>
                <div className='absolute bottom-2 left-2'>
                  <Badge
                    variant='secondary'
                    className='bg-slate-800 text-white border-0 text-xs'
                  >
                    {experience.contentConfig?.sceneObjects?.length || 0}{' '}
                    objects
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <CardTitle className='line-clamp-1 text-white'>
                  {experience.title}
                </CardTitle>
                <CardDescription className='line-clamp-2 text-slate-400'>
                  {experience.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                    onClick={() => handleLaunchViewer(experience)}
                  >
                    <Play className='h-4 w-4 mr-1' />
                    Launch AR
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='border-slate-600 text-slate-300 hover:bg-slate-700'
                    onClick={() => handleEditExperience(experience)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='border-slate-600 text-slate-300 hover:bg-slate-700'
                    onClick={() => handleViewExperience(experience)}
                  >
                    <Eye className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='border-slate-600 text-slate-300 hover:bg-slate-700'
                    onClick={() => handleShare(experience)}
                  >
                    <Share className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
