'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/lib/context/DataContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, authLoading, signIn, signUp, authError } = useData()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')
  const [isFemale, setIsFemale] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'signin') {
      const result = await signIn(email, password)
      if (result.error) {
        setError(result.error.message)
      }
    } else {
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required.')
        setLoading(false)
        return
      }

      if (!/^\d{10,15}$/.test(mobile)) {
        setError('Mobile number must be 10 to 15 digits.')
        setLoading(false)
        return
      }

      const result = await signUp(email, password, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: isFemale ? 'female' : 'male',
        mobile,
      })
      if (result.error) {
        setError(result.error.message)
      } else {
        setMessage('Account created. If email confirmation is enabled, verify your email and then sign in.')
        setMode('signin')
        setFirstName('')
        setLastName('')
        setMobile('')
        setIsFemale(false)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 border border-border shadow-sm">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Credit Card Manager</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to access your data' : 'Create your account'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'signin' ? 'default' : 'outline'}
            onClick={() => setMode('signin')}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={mode === 'signup' ? 'default' : 'outline'}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <span className={`text-sm ${!isFemale ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    Male
                  </span>
                  <Switch checked={isFemale} onCheckedChange={setIsFemale} aria-label="Toggle gender" />
                  <span className={`text-sm ${isFemale ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    Female
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          {(error || authError) && <p className="text-sm text-destructive">{error || authError}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
