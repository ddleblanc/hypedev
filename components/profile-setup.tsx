'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Upload, 
  Twitter, 
  Instagram, 
  Youtube, 
  Globe, 
  MessageSquare,
  Send,
  CheckCircle,
  Loader2,
  ArrowRight,
  Crown,
  X,
  Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadImageToThirdweb } from '@/lib/thirdweb'
import { MediaRenderer } from '@/components/media-renderer'

const socialPlatforms = [
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'discord', label: 'Discord', icon: MessageSquare },
  { value: 'telegram', label: 'Telegram', icon: Send },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
] as const

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profilePicture: z.string().optional(), // Allow IPFS URIs
  bannerImage: z.string().optional(), // Allow IPFS URIs
  socials: z.array(z.object({
    platform: z.enum(['twitter', 'instagram', 'discord', 'telegram', 'website', 'youtube']),
    url: z.string().url('Please enter a valid URL')
  })).optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileSetupProps {
  userId: string
  walletAddress: string
  onComplete: (user: { id: string; walletAddress: string; username?: string; profileCompleted: boolean }) => void
  onApplyCreator: () => void
}

export function ProfileSetup({ userId, walletAddress, onComplete, onApplyCreator }: ProfileSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [socialInputs, setSocialInputs] = useState<Array<{ platform: string; url: string }>>([])
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const profileImageRef = useRef<HTMLInputElement>(null)
  const bannerImageRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      profilePicture: '',
      bannerImage: '',
      socials: []
    }
  })

  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await fetch('/api/user/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, excludeUserId: userId })
      })
      
      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
    }
    setIsCheckingUsername(false)
  }, [userId])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Submitting profile data:', { userId, ...data, profileCompleted: true })
      
      // Process social inputs and ensure URLs have proper protocol
      const processedSocials = socialInputs
        .filter(s => s.url)
        .map(social => ({
          ...social,
          url: social.url.startsWith('http') ? social.url : `https://${social.url}`
        }))
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...data,
          socials: processedSocials,
          profileCompleted: true
        })
      })

      const result = await response.json()
      console.log('Profile update response:', result)
      
      if (result.success) {
        console.log('Profile updated successfully, user:', result.user)
        onComplete(result.user)
      } else {
        console.error('Profile update failed:', result.error)
        alert(`Profile update failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('An error occurred while updating your profile. Please try again.')
    }
    setIsLoading(false)
  }

  const addSocialInput = () => {
    setSocialInputs([...socialInputs, { platform: 'twitter', url: '' }])
  }

  const removeSocialInput = (index: number) => {
    setSocialInputs(socialInputs.filter((_, i) => i !== index))
  }

  const updateSocialInput = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialInputs]
    updated[index] = { ...updated[index], [field]: value }
    setSocialInputs(updated)
    
    // Update form data
    form.setValue('socials', updated.filter(s => s.url).map(s => ({
      ...s,
      platform: s.platform as 'twitter' | 'instagram' | 'discord' | 'telegram' | 'website' | 'youtube'
    })))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Header with premium progress indicator */}
      <div className="border-b bg-card/95 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Profile Setup
                </h1>
                <p className="text-sm text-muted-foreground">Complete your profile to join the elite community</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {(() => {
                    let completed = 0
                    const total = 3
                    if (form.watch('username')) completed++
                    if (form.watch('profilePicture') || form.watch('bannerImage')) completed++
                    if (form.formState.isValid && usernameAvailable !== false) completed++
                    return `${completed}/${total} Complete`
                  })()}
                </div>
                <div className="text-xs text-muted-foreground">Setup Progress</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((step) => {
                  let isCompleted = false
                  if (step === 1 && form.watch('username')) isCompleted = true
                  if (step === 2 && (form.watch('profilePicture') || form.watch('bannerImage'))) isCompleted = true
                  if (step === 3 && form.formState.isValid && usernameAvailable !== false) isCompleted = true
                  
                  return (
                    <div
                      key={step}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        isCompleted 
                          ? "bg-primary shadow-lg shadow-primary/50" 
                          : "bg-muted"
                      )}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 relative z-10">
        {/* Premium Wallet Connection Info */}
        <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center shadow-lg">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-foreground">Connected Wallet</h3>
                <p className="text-sm text-muted-foreground font-mono tracking-wider">{walletAddress}</p>
              </div>
              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 shadow-lg">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Card */}
          <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                  form.watch('username') ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  1
                </div>
                Basic Information
              </CardTitle>
              <CardDescription>
                Choose a unique username and tell your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    {...form.register('username')}
                    placeholder="@username"
                    className="pr-10"
                    onChange={(e) => {
                      form.setValue('username', e.target.value)
                      checkUsername(e.target.value)
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {usernameAvailable === false && (
                  <p className="text-sm text-destructive">This username is already taken</p>
                )}
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  {...form.register('bio')}
                  placeholder="Share your story with the community..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {form.watch('bio')?.length || 0} / 500
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Identity Card */}
          <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                  (form.watch('profilePicture') || form.watch('bannerImage')) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  2
                </div>
                Visual Identity
              </CardTitle>
              <CardDescription>
                Upload images that represent you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Profile Picture</Label>
                <div className="flex items-start gap-6">
                  <div className="h-24 w-24 rounded-full overflow-hidden border">
                    {form.watch('profilePicture') ? (
                      <MediaRenderer
                        src={form.watch('profilePicture') || ''}
                        alt="Profile picture"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">Upload profile image</p>
                      <input
                        ref={profileImageRef}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setIsUploadingProfile(true)
                            try {
                              const ipfsUri = await uploadImageToThirdweb(file)
                              form.setValue('profilePicture', ipfsUri)
                              toast({
                                title: "Success",
                                description: "Profile picture uploaded successfully",
                              })
                            } catch (error) {
                              console.error('Error uploading profile image:', error)
                              toast({
                                title: "Upload Failed",
                                description: "Failed to upload image to IPFS. Please try again.",
                                variant: "destructive",
                              })
                            }
                            setIsUploadingProfile(false)
                          }
                        }}
                        className="hidden"
                        id="profileImage"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={isUploadingProfile}
                        onClick={() => profileImageRef.current?.click()}
                      >
                        {isUploadingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Choose File'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 400×400px • Max 2MB • JPG or PNG
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Banner Image</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Upload banner image</p>
                  <input
                    ref={bannerImageRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setIsUploadingBanner(true)
                        try {
                          const ipfsUri = await uploadImageToThirdweb(file)
                          form.setValue('bannerImage', ipfsUri)
                          toast({
                            title: "Success",
                            description: "Banner image uploaded successfully",
                          })
                        } catch (error) {
                          console.error('Error uploading banner image:', error)
                          toast({
                            title: "Upload Failed",
                            description: "Failed to upload image to IPFS. Please try again.",
                            variant: "destructive",
                          })
                        }
                        setIsUploadingBanner(false)
                      }
                    }}
                    className="hidden"
                    id="bannerImage"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={isUploadingBanner}
                    onClick={() => bannerImageRef.current?.click()}
                  >
                    {isUploadingBanner ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Choose File'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Recommended: 1500×500px • Max 5MB • Showcase your style
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Presence Card */}
          <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    Social Presence
                  </CardTitle>
                  <CardDescription>
                    Connect your social accounts (optional)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialInput}
                  disabled={socialInputs.length >= 6}
                  className="gap-1"
                >
                  + Add Social
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {socialInputs.length > 0 ? (
                <div className="space-y-4">
                  {socialInputs.map((social, index) => {
                    const PlatformIcon = socialPlatforms.find(p => p.value === social.platform)?.icon || Globe
                    return (
                      <Card key={index} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <PlatformIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <Select
                            value={social.platform}
                            onValueChange={(value) => updateSocialInput(index, 'platform', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {socialPlatforms.map((platform) => (
                                <SelectItem key={platform.value} value={platform.value}>
                                  <div className="flex items-center gap-2">
                                    <platform.icon className="h-4 w-4" />
                                    {platform.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder={`${socialPlatforms.find(p => p.value === social.platform)?.label} URL`}
                            value={social.url}
                            onChange={(e) => updateSocialInput(index, 'url', e.target.value)}
                            className="flex-1"
                          />
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSocialInput(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-1">No social accounts connected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your social profiles to build your presence
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSocialInput}
                    className="gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Add Social Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-gradient-to-r from-card/95 to-primary/5 backdrop-blur-xl border-primary/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    Ready to join the elite?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete your profile to access premium collections and exclusive drops
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onApplyCreator}
                    className="gap-2 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 hover:border-yellow-500/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Crown className="h-4 w-4" />
                    Apply as Creator
                  </Button>
                  
                  <Button
                    type="button"
                    disabled={isLoading || !form.watch('username') || usernameAvailable === false}
                    onClick={async () => {
                      const formData = form.getValues()
                      await onSubmit(formData)
                    }}
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 px-8 py-3 text-base font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}