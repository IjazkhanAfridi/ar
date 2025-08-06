import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import Logo from '../../public/logo.jpg';

export function Layout({ children, user, onUserUpdate }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authUtils.logout();
      onUserUpdate(null);
      setIsDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogoClick = () => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <header className='p-4 border-b bg-gray-50 border-slate-800 flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <button
            onClick={handleLogoClick}
            className='bg-slate-800 h-auto w-12 flex items-center justify-center rounded-md'
          >
            <img src={Logo} alt='Logo' />
          </button>
        </div>

        <div className='flex items-center gap-4'>
          <span className='text-slate-600'>
            Welcome {user.name} {user.role === 'admin' && '(Admin)'}
          </span>

          {/* User Profile Dropdown */}
          <div className='relative' ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className='h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500'
            >
              <span className='sr-only'>User profile</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='w-6 h-6 text-white'
              >
                <path
                  fillRule='evenodd'
                  d='M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z'
                  clipRule='evenodd'
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200'>
                <div className='px-4 py-2 text-sm text-gray-700 border-b border-gray-100'>
                  <div className='font-medium'>{user.name}</div>
                  <div className='text-gray-500'>{user.email}</div>
                  <div className='text-xs text-blue-600 font-medium mt-1'>
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>

                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsDropdownOpen(false);
                    }}
                    className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => {
                    navigate('/experiences');
                  }}
                  className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  My Experiences
                </button>
                <button
                  onClick={handleLogout}
                  className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className='flex-1'>{children}</main>
    </div>
  );
}
