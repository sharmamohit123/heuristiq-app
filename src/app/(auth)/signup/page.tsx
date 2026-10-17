'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // With email confirmation disabled in Supabase, signUp returns a session.
      if (data.session) {
        toast.success('Account created! Your demo experiment is ready.')
        router.push('/dashboard')
        router.refresh()
        return
      }

      toast.success('Account created! Please check your email to verify.')
      router.push('/login')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Mobile Logo */}
      <div className="lg:hidden flex flex-col items-center justify-center gap-3 mb-8">
        <Image
          src="/heuristiq-logo-192.png"
          alt="Heuristiq"
          width={64}
          height={64}
          className="drop-shadow-xl"
        />
        <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          Heuristiq
        </span>
      </div>

      <Card className="border-0 shadow-none lg:border lg:shadow-xl lg:shadow-slate-200/50 bg-white">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-slate-900">Create an account</CardTitle>
          <CardDescription className="text-slate-500">
            Start running automated UX tests in minutes
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400">
                Must be at least 6 characters
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            <p className="text-sm text-slate-500 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
