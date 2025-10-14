"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, googleLogin, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to prompts page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('[LoginPage] User already authenticated, redirecting to /prompts')
      router.push('/prompts')
    }
  }, [isAuthenticated, authLoading, router])

  const hasGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
    !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-google-client-id')

  useEffect(() => {
    if (!hasGoogleClientId) {
      console.log('Google Client ID not configured, skipping Google script load');
      return;
    }

    console.log('Loading Google Identity Services script...');
    
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      console.log('Google script loaded successfully');
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
            callback: handleGoogleResponse,
            use_fedcm_for_prompt: false, // Disable FedCM due to browser compatibility issues
            // Standard OAuth configuration
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          console.log('Google OAuth initialized successfully');
        } catch (error) {
          console.error('Error initializing Google OAuth:', error);
          setError('Failed to initialize Google Sign-In. Please refresh the page.');
        }
      } else {
        console.error('Google object not found after script load');
        setError('Google Sign-In service unavailable. Please refresh the page.');
      }
    }

    script.onerror = (error) => {
      console.error('Failed to load Google Identity Services script:', error);
      setError('Failed to load Google Sign-In. Please check your internet connection.');
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [hasGoogleClientId])

  const handleGoogleResponse = async (response: any) => {
    try {
      console.log('Google OAuth response received:', response);
      setIsLoading(true);
      await googleLogin(response.credential)
      router.push('/prompts')
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(`Google sign-in failed: ${error?.message || 'Please try again.'}`)
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      console.log('Triggering Google sign-in with popup OAuth flow');
      // Use popup OAuth flow directly to avoid FedCM 403 errors
      handlePopupFallback();
    } else {
      console.error('Google Identity Services not loaded');
      setError('Google sign-in is not available. Please refresh the page.');
    }
  }

  const handlePopupFallback = () => {
    try {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        console.log('Attempting popup-based Google OAuth...');
        
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          scope: 'openid email profile',
          callback: async (response: any) => {
            if (response.access_token) {
              console.log('Access token received from popup, getting user info...');
              try {
                // Get user info using access token
                const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
                const userInfo = await userInfoResponse.json();
                
                if (userInfo.email) {
                  // Create a mock credential object similar to ID token flow
                  const mockCredential = btoa(JSON.stringify({
                    iss: 'accounts.google.com',
                    aud: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    email: userInfo.email,
                    name: userInfo.name,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    picture: userInfo.picture,
                    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
                  }));
                  
                  await handleGoogleResponse({ credential: mockCredential });
                } else {
                  setError('Failed to get user information from Google.');
                }
              } catch (error) {
                console.error('Error getting user info from Google:', error);
                setError('Failed to authenticate with Google. Please try again.');
              }
            } else {
              setError('No access token received from Google.');
            }
          },
          error_callback: (error: any) => {
            console.error('Popup OAuth error:', error);
            setError('Google sign-in failed. Please try again.');
          }
        });

        client.requestAccessToken();
      } else {
        setError('Google OAuth popup not available. Please refresh the page.');
      }
    } catch (error) {
      console.error('Popup fallback error:', error);
      setError('Failed to show Google sign-in. Please try again.');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      router.push('/prompts') // Redirect to prompts page after login
    } catch (error: any) {
      setError(error?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Hide login form if user is already authenticated (they'll be redirected)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to xR2
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your prompt management platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username or Email
                </label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in
                  </span>
                )}
              </Button>
            </form>

            {hasGoogleClientId && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Demo credentials: <br />
                Username: <code className="bg-gray-100 px-2 py-1 rounded">www</code> <br />
                Password: <code className="bg-gray-100 px-2 py-1 rounded">LHaoawJOpxhYfGmP2mHX</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}