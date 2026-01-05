'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Wallet,
  Mail,
  Globe,
  Twitter,
  MessageCircle,
  Save,
  Trash2,
  LogOut,
  ChevronRight,
  Camera,
  Link,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  tradeAlerts: boolean;
  priceAlerts: boolean;
  newFollowers: boolean;
}

interface PrivacySettings {
  showActivity: boolean;
  showCollection: boolean;
  showStats: boolean;
  allowMessages: boolean;
}

function SettingsPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();

  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [website, setWebsite] = useState('');

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    tradeAlerts: true,
    priceAlerts: true,
    newFollowers: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showActivity: true,
    showCollection: true,
    showStats: true,
    allowMessages: true,
  });

  // tRPC mutation for updating profile
  const updateProfileMutation = trpc.user.profile.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile',
        variant: 'destructive',
      });
    },
  });

  const isSaving = updateProfileMutation.isPending;

  // Load user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio((user as any).bio || '');
      // Extract social links
      const socials = (user as any).socials || [];
      const twitter = socials.find((s: any) => s.platform === 'twitter');
      const discord = socials.find((s: any) => s.platform === 'discord');
      const web = socials.find((s: any) => s.platform === 'website');
      if (twitter) setTwitterHandle(twitter.url);
      if (discord) setDiscordHandle(discord.url);
      if (web) setWebsite(web.url);
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!user?.walletAddress) return;

    const socials: Array<{ platform: 'twitter' | 'discord' | 'website'; url: string }> = [];
    if (twitterHandle) socials.push({ platform: 'twitter', url: twitterHandle });
    if (discordHandle) socials.push({ platform: 'discord', url: discordHandle });
    if (website) socials.push({ platform: 'website', url: website });

    updateProfileMutation.mutate({
      address: user.walletAddress,
      username: username || undefined,
      bio,
      socials,
    });
  };

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pt-20"
    >
      {/* Header */}
      <div className="px-4 md:px-8 pb-6 border-b border-white/10">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="h-7 w-7 text-white/80" />
          Settings
        </h1>
        <p className="text-white/60 mt-1">Manage your account and preferences</p>
      </div>

      <div className="px-4 md:px-8 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Profile Section */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your public profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  className="bg-white/5 border-white/20 text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label className="text-white">Social Links</Label>

                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                  <Input
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="Twitter handle"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-[#5865F2]" />
                  <Input
                    value={discordHandle}
                    onChange={(e) => setDiscordHandle(e.target.value)}
                    placeholder="Discord username"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-white/60" />
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Website URL"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get notified in your browser' },
                { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'When someone makes an offer on your NFT' },
                { key: 'priceAlerts', label: 'Price Alerts', desc: 'When items on your watchlist change price' },
                { key: 'newFollowers', label: 'New Followers', desc: 'When someone follows you' },
                { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive news and promotional content' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof NotificationSettings]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>Control what others can see on your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'showActivity', label: 'Show Activity', desc: 'Display your recent activity on your profile' },
                { key: 'showCollection', label: 'Show Collection', desc: 'Make your NFT collection visible to others' },
                { key: 'showStats', label: 'Show Stats', desc: 'Display your gaming and trading statistics' },
                { key: 'allowMessages', label: 'Allow Messages', desc: 'Let others send you direct messages' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={privacy[item.key as keyof PrivacySettings]}
                    onCheckedChange={(checked) =>
                      setPrivacy((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Wallet Section */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Connected Wallet
              </CardTitle>
              <CardDescription>Your linked wallet address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-white font-mono">
                      {user?.walletAddress
                        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                        : 'Not connected'}
                    </p>
                    <p className="text-xs text-white/60">Primary wallet</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white">
                  <Link className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-500/5 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Sign Out</p>
                  <p className="text-xs text-white/60">Disconnect your wallet and sign out</p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireOnboarding>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
