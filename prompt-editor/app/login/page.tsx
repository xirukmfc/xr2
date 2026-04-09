"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  const { login, googleLogin, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  // Splash screen animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 1500) // Show splash for 1.5 seconds

    return () => clearTimeout(timer)
  }, [])

  // Check if user was redirected due to session expiration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('expired') === 'true') {
        setSessionExpired(true);
        setError(t('auth.login.errors.sessionExpired'));
      }
    }
  }, [t]);

  // Redirect authenticated users to prompts page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/prompts')
    }
  }, [isAuthenticated, authLoading, router])

  const hasGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
    !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-google-client-id')
  
  // Enable password login only if explicitly enabled (for testing/development)
  const enablePasswordLogin = process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === 'true'

  useEffect(() => {
    if (!hasGoogleClientId) {
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
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
        } catch (error) {
          console.error('Error initializing Google OAuth:', error);
          setError(t('auth.login.errors.googleInitFailed'));
        }
      } else {
        console.error('Google object not found after script load');
        setError(t('auth.login.errors.googleUnavailable'));
      }
    }

    script.onerror = (error) => {
      console.error('Failed to load Google Identity Services script:', error);
      setError(t('auth.login.errors.googleLoadFailed'));
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [hasGoogleClientId, t])

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      await googleLogin(response.credential, rememberMe)
      router.push('/prompts')
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(t('auth.login.errors.googleSignInFailedWithMessage', { message: error?.message || t('auth.login.errors.tryAgain') }))
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      // Use popup OAuth flow directly to avoid FedCM 403 errors
      handlePopupFallback();
    } else {
      console.error('Google Identity Services not loaded');
      setError(t('auth.login.errors.googleNotAvailable'));
    }
  }

  const handlePopupFallback = () => {
    try {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          scope: 'openid email profile',
          callback: async (response: any) => {
            if (response.access_token) {
              try {
                // Get user info using access token
                const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
                const userInfo = await userInfoResponse.json();
                
                if (userInfo.email) {
                  // Create a mock credential object similar to ID token flow
                  const jsonStr = JSON.stringify({
                    iss: 'accounts.google.com',
                    aud: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    email: userInfo.email,
                    name: userInfo.name,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    picture: userInfo.picture,
                    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
                  });
                  // Use TextEncoder to handle Unicode names (e.g. Cyrillic, CJK)
                  const mockCredential = btoa(String.fromCharCode(...new TextEncoder().encode(jsonStr)));
                  
                  await handleGoogleResponse({ credential: mockCredential });
                } else {
                  setError(t('auth.login.errors.googleUserInfoFailed'));
                }
              } catch (error) {
                console.error('Error getting user info from Google:', error);
                setError(t('auth.login.errors.googleAuthFailed'));
              }
            } else {
              setError(t('auth.login.errors.googleNoToken'));
            }
          },
          error_callback: (error: any) => {
            console.error('Popup OAuth error:', error);
            setError(t('auth.login.errors.googlePopupFailed'));
          }
        });

        client.requestAccessToken();
      } else {
        setError(t('auth.login.errors.googlePopupUnavailable'));
      }
    } catch (error) {
      console.error('Popup fallback error:', error);
      setError(t('auth.login.errors.googlePopupShowFailed'));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password, rememberMe)
      router.push('/prompts') // Redirect to prompts page after login
    } catch (error: any) {
      setError(error?.message || t('auth.login.errors.loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Hide login form if user is already authenticated (they'll be redirected)
  if (isAuthenticated) {
    return null
  }

  // Splash screen
  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <img
          src="/tagline.svg"
          alt="xR2 Prompt Manager"
          className="h-12 w-auto animate-fade-in"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <div className="text-center">
          <img
            src="/tagline.svg"
            alt="xR2 Prompt Manager"
            className="mx-auto h-8 w-auto mb-6"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.login.title')}</CardTitle>
            <CardDescription>
              {t('auth.login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enablePasswordLogin && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-foreground">
                    {t('auth.login.usernameLabel')}
                  </label>
                  <Input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('auth.login.usernamePlaceholder')}
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    {t('auth.login.passwordLabel')}
                  </label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.login.passwordPlaceholder')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                    {t('auth.login.remember')}
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('auth.login.buttonLoading')}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      {t('auth.login.button')}
                    </>
                  )}
                </Button>
              </form>
            )}

            {!enablePasswordLogin && error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
            )}

            {hasGoogleClientId ? (
              <div className={enablePasswordLogin ? "mt-6" : ""}>
                {enablePasswordLogin && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground">{t('auth.login.divider')}</span>
                    </div>
                  </div>
                )}

                <div className={enablePasswordLogin ? "mt-6" : ""}>
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
                    {t('auth.login.googleButton')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                {t('auth.login.googleNotConfigured') || 'Google OAuth не настроен'}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
