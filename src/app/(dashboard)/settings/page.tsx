'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, NotificationPreferences } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, User, Key, Bell, Trash2, Mail, Check } from 'lucide-react'

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  experiment_completed_email: true,
  experiment_completed_app: true,
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS)
  const [isSavingNotifs, setIsSavingNotifs] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setProfile(data)
          setName(data.name || '')
          if (data.notification_preferences) {
            setNotifPrefs({
              ...DEFAULT_NOTIFICATION_PREFS,
              ...(data.notification_preferences as NotificationPreferences),
            })
          }
        }
      }
      setIsFetching(false)
    }

    fetchProfile()
  }, [])

  const handleUpdateProfile = async () => {
    if (!profile) return
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', profile.id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Profile updated!')
      setProfile({ ...profile, name })
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleNotifPref = async (key: keyof NotificationPreferences) => {
    if (!profile) return
    setIsSavingNotifs(true)

    const updatedPrefs = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', profile.id)

      if (error) {
        toast.error('Failed to update notification preference')
        return
      }

      setNotifPrefs(updatedPrefs)
      toast.success('Notification preference updated')
    } catch {
      toast.error('Failed to update notification preference')
    } finally {
      setIsSavingNotifs(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-5 w-56 bg-muted animate-pulse rounded" />
          </div>

          {/* Profile Card */}
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-52 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="h-px w-full bg-muted" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
          </div>

          {/* API Keys Card */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-4 w-44 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Notifications Card */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-6 w-36 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-9 w-20 bg-muted animate-pulse rounded-lg" />
              </div>
              <div className="h-px w-full bg-muted" />
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-56 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-9 w-20 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {name?.charAt(0) || profile?.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Avatar</Button>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <Button onClick={handleUpdateProfile} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure your API keys for AI services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Google Gemini API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="••••••••••••••••"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                API keys are configured via environment variables for security.
              </p>
            </div>
          </CardContent>
        </Card> */}

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications when experiments complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* In-App Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">In-App Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified in the notification bell when an experiment completes.
                    </p>
                  </div>
                </div>
                <Button 
                  variant={notifPrefs.experiment_completed_app ? "default" : "outline"} 
                  size="sm"
                  className="min-w-[90px]"
                  disabled={isSavingNotifs}
                  onClick={() => handleToggleNotifPref('experiment_completed_app')}
                >
                  {isSavingNotifs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : notifPrefs.experiment_completed_app ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Enabled
                    </>
                  ) : (
                    'Enable'
                  )}
                </Button>
              </div>

              <Separator />

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email summary when an experiment finishes running.
                    </p>
                  </div>
                </div>
                <Button 
                  variant={notifPrefs.experiment_completed_email ? "default" : "outline"} 
                  size="sm"
                  className="min-w-[90px]"
                  disabled={isSavingNotifs}
                  onClick={() => handleToggleNotifPref('experiment_completed_email')}
                >
                  {isSavingNotifs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : notifPrefs.experiment_completed_email ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Enabled
                    </>
                  ) : (
                    'Enable'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="font-medium text-red-700">Delete Account</p>
                <p className="text-sm text-red-600">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </div>
          </CardContent>
        </Card>

        <div className="h-8" />
      </div>
    </div>
  )
}
