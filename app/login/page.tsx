'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CreditCard, DollarSign, TrendingUp, Wallet, BarChart2,
  PiggyBank, Banknote, Landmark, Receipt, ArrowUpRight,
  Percent, CircleDollarSign, TrendingDown, Building2,
  Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/lib/context/DataContext'

const FLOAT_ANIMS = ['finance-float-a', 'finance-float-b', 'finance-float-c', 'finance-float-d'] as const

const FLOATING_ICONS = [
  { Icon: CreditCard,       x: 5,  y: 10, size: 32, color: '#d4af37', anim: 0, dur: 7,  delay: 0   },
  { Icon: DollarSign,       x: 15, y: 75, size: 28, color: '#e8c547', anim: 1, dur: 9,  delay: 1.5 },
  { Icon: TrendingUp,       x: 80, y: 15, size: 36, color: '#c9a227', anim: 2, dur: 8,  delay: 0.5 },
  { Icon: Wallet,           x: 88, y: 68, size: 30, color: '#f5e08e', anim: 3, dur: 11, delay: 2   },
  { Icon: BarChart2,        x: 70, y: 85, size: 34, color: '#d4af37', anim: 0, dur: 10, delay: 3   },
  { Icon: PiggyBank,        x: 25, y: 88, size: 28, color: '#e8c547', anim: 1, dur: 8,  delay: 1   },
  { Icon: Banknote,         x: 92, y: 40, size: 30, color: '#b8860b', anim: 2, dur: 12, delay: 0.8 },
  { Icon: Landmark,         x: 3,  y: 55, size: 26, color: '#d4af37', anim: 3, dur: 9,  delay: 2.5 },
  { Icon: Receipt,          x: 60, y: 5,  size: 24, color: '#f5e08e', anim: 0, dur: 7,  delay: 4   },
  { Icon: ArrowUpRight,     x: 45, y: 92, size: 32, color: '#e8c547', anim: 1, dur: 10, delay: 1.2 },
  { Icon: Percent,          x: 10, y: 40, size: 22, color: '#c9a227', anim: 2, dur: 8,  delay: 3.5 },
  { Icon: CircleDollarSign, x: 75, y: 55, size: 36, color: '#d4af37', anim: 3, dur: 13, delay: 0.3 },
  { Icon: TrendingDown,     x: 35, y: 6,  size: 28, color: '#b8860b', anim: 0, dur: 9,  delay: 2.8 },
  { Icon: Building2,        x: 55, y: 78, size: 30, color: '#e8c547', anim: 1, dur: 11, delay: 1.7 },
  { Icon: CreditCard,       x: 18, y: 22, size: 20, color: '#f5e08e', anim: 2, dur: 7,  delay: 0.6 },
  { Icon: DollarSign,       x: 82, y: 30, size: 24, color: '#d4af37', anim: 3, dur: 10, delay: 3.2 },
  { Icon: TrendingUp,       x: 48, y: 18, size: 26, color: '#c9a227', anim: 0, dur: 8,  delay: 1.9 },
  { Icon: Wallet,           x: 65, y: 96, size: 22, color: '#e8c547', anim: 1, dur: 12, delay: 0.1 },
]

export default function LoginPage() {
  const router = useRouter()
  const { user, authLoading, signIn, signUp } = useData()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')
  const [isFemale, setIsFemale] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (mode === 'signin') {
      const result = await signIn(email, password)
      if (result.error) {
        toast.error(result.error.message)
      } else {
        router.replace('/')
        return
      }
    } else {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error('First name and last name are required.')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match.')
        setLoading(false)
        return
      }

      if (!/^\d{10,15}$/.test(mobile)) {
        toast.error('Mobile number must be 10 to 15 digits.')
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
        toast.error(result.error.message)
      } else {
        toast.success('Account created. If email confirmation is enabled, verify your email and then sign in.')
        setMode('signin')
        setFirstName('')
        setLastName('')
        setMobile('')
        setIsFemale(false)
        setConfirmPassword('')
      }
    }

    setLoading(false)
  }

  const inputCls =
    'bg-white/5 border-amber-400/20 text-amber-50 placeholder:text-amber-200/30 focus-visible:ring-amber-400/25 focus-visible:border-amber-400/60 transition-colors'

  if (authLoading || user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0700 28%, #140c00 60%, #000000 100%)' }}
        />
        <div className="relative z-10 text-sm text-amber-200/60">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

      {/* ── Deep black gradient background ── */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0700 28%, #140c00 60%, #000000 100%)' }}
      />

      {/* ── Ambient gold glow orbs ── */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          top: '8%', left: '6%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
          animation: 'orb-breathe 9s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          bottom: '8%', right: '5%', width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(184,134,11,0.14) 0%, transparent 70%)',
          animation: 'orb-breathe 12s ease-in-out infinite 2s',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          top: '45%', left: '42%', width: 540, height: 540,
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle, rgba(232,197,71,0.07) 0%, transparent 70%)',
          animation: 'orb-breathe 15s ease-in-out infinite 5s',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          top: '65%', left: '22%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(180,120,10,0.11) 0%, transparent 70%)',
          animation: 'orb-breathe 10s ease-in-out infinite 3s',
        }}
      />

      {/* ── Floating finance icons ── */}
      {FLOATING_ICONS.map(({ Icon, x, y, size, color, anim, dur, delay }, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animation: `${FLOAT_ANIMS[anim]} ${dur}s ease-in-out ${delay}s infinite`,
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        >
          <Icon size={size} color={color} strokeWidth={1.5} />
        </div>
      ))}

      {/* ── Glass card ── */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(212,175,55,0.06)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(212,175,55,0.22)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.80), inset 0 1px 0 rgba(212,175,55,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #b8860b, #d4af37, #e8c547)', boxShadow: '0 2px 12px rgba(212,175,55,0.40)' }}
              >
                <CreditCard size={18} color="#fff" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Credit Card Manager</h1>
            </div>
            <p
              className="text-sm text-white/50 ml-11"
              style={{ transition: 'opacity 0.25s ease' }}
            >
              {mode === 'signin' ? 'Sign in to access your data' : 'Create your account'}
            </p>
          </div>

          {/* Mode toggle */}
          <div
            className="grid grid-cols-2 gap-1 mb-6 rounded-xl p-1"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          >
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="py-2 rounded-lg text-sm font-medium"
                style={{
                  background: mode === m
                    ? 'linear-gradient(135deg, #b8860b, #d4af37, #e8c547)'
                    : 'transparent',
                  color: mode === m ? '#0a0700' : 'rgba(245,240,224,0.45)',
                  boxShadow: mode === m ? '0 4px 18px rgba(212,175,55,0.45)' : 'none',
                  fontWeight: mode === m ? '700' : '500',
                  transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signup-only fields — always in DOM so height can animate */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: mode === 'signup' ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  opacity: mode === 'signup' ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                }}
              >
                <div className="space-y-4 pt-0 pb-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">
                        First Name
                      </Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John" required={mode === 'signup'}
                        tabIndex={mode === 'signup' ? undefined : -1}
                        className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">
                        Last Name
                      </Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe" required={mode === 'signup'}
                        tabIndex={mode === 'signup' ? undefined : -1}
                        className={inputCls} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">
                      Mobile Number
                    </Label>
                    <Input id="mobile" type="tel" value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210" required={mode === 'signup'}
                      tabIndex={mode === 'signup' ? undefined : -1}
                      className={inputCls} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">Gender</Label>
                    <div
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                      style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}
                    >
                      <span className={`text-sm ${!isFemale ? 'text-amber-100 font-medium' : 'text-amber-200/35'}`}>Male</span>
                      <Switch checked={isFemale} onCheckedChange={setIsFemale} aria-label="Toggle gender" />
                      <span className={`text-sm ${isFemale ? 'text-amber-100 font-medium' : 'text-amber-200/35'}`}>Female</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" minLength={6} required
                  className={inputCls + ' pr-10'} />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-200/40 hover:text-amber-200/80 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password — sign up only */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: mode === 'signup' ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div style={{ overflow: 'hidden', opacity: mode === 'signup' ? 1 : 0, transition: 'opacity 0.35s ease' }}>
                <div className="space-y-1.5 pb-1">
                  <Label htmlFor="confirmPassword" className="text-amber-200/60 text-xs font-medium uppercase tracking-wider">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required={mode === 'signup'}
                      tabIndex={mode === 'signup' ? undefined : -1}
                      className={inputCls + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-200/40 hover:text-amber-200/80 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 mt-2"
              style={{
                background: loading
                  ? 'rgba(212,175,55,0.35)'
                  : 'linear-gradient(135deg, #b8860b 0%, #d4af37 40%, #e8c547 100%)',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(212,175,55,0.50)',
                color: loading ? 'rgba(245,240,224,0.5)' : '#0a0700',
                backgroundSize: '200% 100%',
              }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-amber-200/25 text-xs mt-5">
            Your financial data, secure & private
          </p>
        </div>
      </div>
    </div>
  )
}

