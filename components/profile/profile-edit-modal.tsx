'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MediaRenderer } from '@/components/media-renderer';
import { uploadImageToThirdweb } from '@/lib/thirdweb';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Loader2,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  MessageSquare,
  Send,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const socialPlatforms = [
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'discord', label: 'Discord', icon: MessageSquare },
  { value: 'telegram', label: 'Telegram', icon: Send },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
] as const;

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserSocial {
  platform: string;
  url: string;
}

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username?: string | null;
    bio?: string | null;
    profilePicture?: string | null;
    bannerImage?: string | null;
    socials?: UserSocial[];
  };
  onSave: (data: {
    username?: string;
    bio?: string;
    profilePicture?: string;
    bannerImage?: string;
    socials?: UserSocial[];
  }) => Promise<void>;
}

export function ProfileEditModal({
  open,
  onOpenChange,
  user,
  onSave,
}: ProfileEditModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [bannerImage, setBannerImage] = useState(user.bannerImage || '');
  const [socialInputs, setSocialInputs] = useState<UserSocial[]>(user.socials || []);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username || '',
      bio: user.bio || '',
    },
  });

  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3 || username === user.username) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch('/api/user/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentUserId: user.id }),
      });
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  }, [user.username, user.id]);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProfile(true);
    try {
      const uri = await uploadImageToThirdweb(file);
      setProfilePicture(uri);
    } catch (error) {
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const uri = await uploadImageToThirdweb(file);
      setBannerImage(uri);
    } catch (error) {
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const addSocialInput = () => {
    if (socialInputs.length >= 6) {
      toast({ title: 'Maximum 6 social links allowed', variant: 'destructive' });
      return;
    }
    setSocialInputs([...socialInputs, { platform: '', url: '' }]);
  };

  const removeSocialInput = (index: number) => {
    setSocialInputs(socialInputs.filter((_, i) => i !== index));
  };

  const updateSocialInput = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialInputs];
    updated[index] = { ...updated[index], [field]: value };
    setSocialInputs(updated);
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (usernameAvailable === false) {
      toast({ title: 'Username is not available', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty social inputs
      const validSocials = socialInputs.filter(
        (s) => s.platform && s.url && s.url.startsWith('http')
      );

      await onSave({
        username: data.username,
        bio: data.bio,
        profilePicture,
        bannerImage,
        socials: validSocials,
      });

      toast({ title: 'Profile updated successfully' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Banner Image */}
          <div className="space-y-2">
            <Label className="text-white/70">Banner Image</Label>
            <div
              className="relative h-32 rounded-xl overflow-hidden bg-white/5 cursor-pointer group"
              onClick={() => bannerInputRef.current?.click()}
            >
              {bannerImage ? (
                <MediaRenderer
                  src={bannerImage}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[rgb(163,255,18)]/20 to-purple-500/20" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingBanner ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerImageUpload}
              />
            </div>
          </div>

          {/* Profile Picture */}
          <div className="space-y-2">
            <Label className="text-white/70">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden bg-white/5 cursor-pointer group"
                onClick={() => profileInputRef.current?.click()}
              >
                {profilePicture ? (
                  <MediaRenderer
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">
                      {form.watch('username')?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploadingProfile ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
              </div>
              <p className="text-xs text-white/40">
                Click to upload a new profile picture
              </p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="text-white/70">Username</Label>
            <div className="relative">
              <Input
                {...form.register('username')}
                placeholder="username"
                className="bg-white/5 border-white/10 text-white pr-10"
                onChange={(e) => {
                  form.setValue('username', e.target.value);
                  checkUsername(e.target.value);
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {form.formState.errors.username && (
              <p className="text-xs text-red-500">
                {form.formState.errors.username.message}
              </p>
            )}
            {usernameAvailable === false && (
              <p className="text-xs text-red-500">Username is already taken</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-white/70">Bio</Label>
            <Textarea
              {...form.register('bio')}
              placeholder="Tell us about yourself..."
              className="bg-white/5 border-white/10 text-white min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-white/40 text-right">
              {form.watch('bio')?.length || 0}/500
            </p>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/70">Social Links</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSocialInput}
                className="text-[rgb(163,255,18)] hover:text-[rgb(163,255,18)]/80"
                disabled={socialInputs.length >= 6}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {socialInputs.map((social, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={social.platform}
                    onValueChange={(value) => updateSocialInput(index, 'platform', value)}
                  >
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      {socialPlatforms.map((platform) => (
                        <SelectItem
                          key={platform.value}
                          value={platform.value}
                          className="text-white hover:bg-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <platform.icon className="w-4 h-4" />
                            {platform.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="https://..."
                    value={social.url}
                    onChange={(e) => updateSocialInput(index, 'url', e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialInput(index)}
                    className="text-white/40 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploadingProfile || isUploadingBanner}
              className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
