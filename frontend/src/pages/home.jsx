import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Camera,
  Images,
  Box,
  Fingerprint,
  SmilePlus,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const experienceTypes = [
    {
      id: 'image-tracking',
      title: 'Image Tracking',
      icon: Camera,
      description: 'Create AR experiences based on image recognition',
      path: '/image-tracking',
    },
    {
      id: 'multiple-image',
      title: 'Multiple Image',
      icon: Images,
      description: 'Use multiple images for an advanced AR experience',
      path: '/multiple-image-tracking',
    },
    {
      id: 'multi-track',
      title: 'Multi-Track',
      icon: Box,
      description: 'Track multiple objects simultaneously',
      path: '/create?type=multi-track',
    },
    {
      id: 'interactivity',
      title: 'Interactivity',
      icon: Fingerprint,
      description: 'Add interactive elements to your AR experience',
      path: '/create?type=interactive',
    },
    {
      id: 'face-tracking',
      title: 'Face Tracking',
      icon: SmilePlus,
      description: 'Create AR effects applied to faces',
      path: '/create?type=face',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      description: 'Configure your AR experience settings',
      path: '/settings',
    },
  ];

  return (
    <div className='min-h-screen w-full bg-slate-900 text-white'>
      {/* Main Content */}
      <main className='container mx-auto p-6'>
        <h2 className='text-2xl font-semibold mb-8'>
          Select AR Experience Type
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {experienceTypes.map((type) => (
            <Link key={type.id} to={type.path}>
              <Card className='bg-slate-800/70 border-slate-700 hover:border-amber-600/50 hover:bg-slate-800 transition-all cursor-pointer h-full'>
                <div className='p-6 flex flex-col items-center text-center'>
                  <div className='bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mb-6'>
                    <type.icon className='h-8 w-8' />
                  </div>
                  <h3 className='text-lg text-gray-100 font-medium mb-2'>{type.title}</h3>
                  <p className='text-gray-100 text-sm'>{type.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className='p-6 border-t border-slate-800 mt-auto'>
        <div className='container mx-auto flex flex-col md:flex-row justify-between items-center'>
          <p className='text-slate-400 text-sm'>
            © 2023 PACKAR - Create your AR experience
          </p>
          <div className='flex gap-4 mt-4 md:mt-0'>
            <Button
              variant='ghost'
              size='sm'
              className='flex gap-2 items-center text-slate-300'
            >
              <HelpCircle className='h-4 w-4' />
              Help
            </Button>
            <Button
              onClick={() => navigate('/experiences')}
              className='bg-blue-600 hover:bg-blue-700'
            >
              My Experiences
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}




// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import {
//   Camera,
//   Images,
//   Box,
//   Fingerprint,
//   SmilePlus,
//   Settings,
//   HelpCircle,
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// export default function Home() {
//   const navigate = useNavigate();
//   const experienceTypes = [
//     {
//       id: 'image-tracking',
//       title: 'Image Tracking',
//       icon: Camera,
//       description: 'Create AR experiences based on image recognition',
//       path: '/image-tracking',
//     },
//     {
//       id: 'multiple-image',
//       title: 'Multiple Image',
//       icon: Images,
//       description: 'Use multiple images for an advanced AR experience',
//       path: '/create?type=multi-image',
//     },
//     {
//       id: 'multi-track',
//       title: 'Multi-Track',
//       icon: Box,
//       description: 'Track multiple objects simultaneously',
//       path: '/create?type=multi-track',
//     },
//     {
//       id: 'interactivity',
//       title: 'Interactivity',
//       icon: Fingerprint,
//       description: 'Add interactive elements to your AR experience',
//       path: '/create?type=interactive',
//     },
//     {
//       id: 'face-tracking',
//       title: 'Face Tracking',
//       icon: SmilePlus,
//       description: 'Create AR effects applied to faces',
//       path: '/create?type=face',
//     },
//     {
//       id: 'settings',
//       title: 'Settings',
//       icon: Settings,
//       description: 'Configure your AR experience settings',
//       path: '/settings',
//     },
//   ];

//   return (
//     <div className='min-h-screen bg-slate-900 text-white'>
//       {/* Main Content */}
//       <main className='container mx-auto p-6'>
//         <h2 className='text-2xl font-semibold mb-8'>
//           Select AR Experience Type
//         </h2>

//         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//           {experienceTypes.map((type) => (
//             <Link key={type.id} to={type.path}>
//               <Card className='bg-slate-800/70 border-slate-700 hover:border-amber-600/50 hover:bg-slate-800 transition-all cursor-pointer h-full'>
//                 <div className='p-6 flex flex-col items-center text-center'>
//                   <div className='bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mb-6'>
//                     <type.icon className='h-8 w-8' />
//                   </div>
//                   <h3 className='text-lg text-gray-100 font-medium mb-2'>{type.title}</h3>
//                   <p className='text-gray-100 text-sm'>{type.description}</p>
//                 </div>
//               </Card>
//             </Link>
//           ))}
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className='p-6 border-t border-slate-800 mt-auto'>
//         <div className='container mx-auto flex flex-col md:flex-row justify-between items-center'>
//           <p className='text-slate-400 text-sm'>
//             © 2023 PACKAR - Create your AR experience
//           </p>
//           <div className='flex gap-4 mt-4 md:mt-0'>
//             <Button
//               variant='ghost'
//               size='sm'
//               className='flex gap-2 items-center text-slate-300'
//             >
//               <HelpCircle className='h-4 w-4' />
//               Help
//             </Button>
//             <Button
//               onClick={() => navigate('/experiences')}
//               className='bg-blue-600 hover:bg-blue-700'
//             >
//               My Experiences
//             </Button>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
