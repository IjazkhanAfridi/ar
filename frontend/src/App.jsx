import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Login from '@/pages/LoginPage';
import Register from '@/pages/register';
import Create from '@/pages/create';
import View from '@/pages/view';
import ImageTOAr from '@/pages/image-to-ar';
import Experiences from './pages/Experiences';
import ExperienceDetail from './pages/ExperienceDetail';
import ImageTracking from './pages/imageTracking';
import ConvertedImage from './pages/ConvertedImage';
import ARSuccessPage from './pages/ARSuccessPage';
import AdminDashboard from './pages/admin-dashboard';
import EditExperience from './pages/edit-experience';
import { SceneConfigProvider } from './contexts/SceneConfigContext';
import MultipleImageTracking from './pages/MultipleImageTracking';
import MultipleImageConfirmation from './pages/MultipleImageConfirmation';
import MultipleImageCreate from './pages/MultipleImageCreate';
import DebugTransform from './pages/debug-transform';
import SimpleTest from './pages/simple-test';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SceneConfigProvider>
        <main className='min-h-screen bg-background'>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/share/:link' element={<View />} />
              <Route path='/debug-transform' element={<DebugTransform />} />
              <Route path='/simple-test' element={<SimpleTest />} />

              {/* User routes - restricted for admins */}
              <Route
                path='/'
                element={
                  <ProtectedRoute restrictAdmin>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/experiences'
                element={
                  <ProtectedRoute>
                    <Experiences />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/experience/:id'
                element={
                  <ProtectedRoute restrictAdmin>
                    <ExperienceDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/edit-experience/:id'
                element={
                  <ProtectedRoute restrictAdmin>
                    <EditExperience />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/create'
                element={
                  <ProtectedRoute>
                    <Create />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/image-to-ar'
                element={
                  <ProtectedRoute restrictAdmin>
                    <ImageTOAr />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/image-tracking'
                element={
                  <ProtectedRoute restrictAdmin>
                    <ImageTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/multiple-image-tracking'
                element={
                  <ProtectedRoute restrictAdmin>
                    <MultipleImageTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/multiple-image-confirmation'
                element={
                  <ProtectedRoute restrictAdmin>
                    <MultipleImageConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/confirm-image'
                element={
                  <ProtectedRoute restrictAdmin>
                    <ConvertedImage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/multiple-image-create'
                element={
                  <ProtectedRoute restrictAdmin>
                    <MultipleImageCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/ar-success'
                element={
                  <ProtectedRoute restrictAdmin>
                    <ARSuccessPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin only routes */}
              <Route
                path='/admin'
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path='*' element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </main>
        <Toaster />
      </SceneConfigProvider>
    </QueryClientProvider>
  );
}
