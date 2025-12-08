'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaRenderer } from '@/components/media-renderer';
import { uploadImageToThirdweb } from '@/lib/thirdweb';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  CheckCircle,
  Share2,
  Settings,
  Twitter,
  Instagram,
  Globe,
  MessageSquare,
  Send,
  Youtube,
  Camera,
  Verified,
  UserPlus,
  UserMinus,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSocial {
  platform: string;
  url: string;
}

interface ProfileHeaderProps {
  user: {
    id: string;
    walletAddress: string;
    username?: string | null;
    bio?: string | null;
    profilePicture?: string | null;
    bannerImage?: string | null;
    isCreator?: boolean;
    creatorApprovedAt?: Date | null;
    socials?: UserSocial[];
  };
  stats: {
    nftsOwned: number;
    collectionsOwned: number;
    followers: number;
    following: number;
    volumeTraded?: string;
  };
  isOwnProfile: boolean;
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  onEditProfile?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onFollowToggle?: () => void;
  onBannerChange?: (uri: string) => void;
  onAvatarChange?: (uri: string) => void;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  instagram: Instagram,
  discord: MessageSquare,
  telegram: Send,
  website: Globe,
  youtube: Youtube,
};

export function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  isFollowing = false,
  isFollowLoading: externalFollowLoading,
  onEditProfile,
  onFollow,
  onUnfollow,
  onFollowToggle,
  onBannerChange,
  onAvatarChange,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [internalFollowLoading, setInternalFollowLoading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Use external loading state if provided, otherwise use internal
  const followLoading = externalFollowLoading ?? internalFollowLoading;

  const isVerified = user.isCreator && user.creatorApprovedAt;
  const displayName = user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;
  const shortAddress = `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    toast({ title: 'Address copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const uri = await uploadImageToThirdweb(file);
      onBannerChange?.(uri);
      toast({ title: 'Banner updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to upload banner', variant: 'destructive' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uri = await uploadImageToThirdweb(file);
      onAvatarChange?.(uri);
      toast({ title: 'Profile picture updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to upload profile picture', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFollowClick = async () => {
    if (followLoading) return;

    // If using the toggle pattern (external loading state)
    if (onFollowToggle) {
      onFollowToggle();
      return;
    }

    // Legacy pattern with separate follow/unfollow handlers
    setInternalFollowLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow?.();
      } else {
        await onFollow?.();
      }
    } finally {
      setInternalFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${user.walletAddress}`;
    if (navigator.share) {
      await navigator.share({
        title: `${displayName}'s Profile`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Profile link copied to clipboard' });
    }
  };

  return (
    <div className="relative">
      {/* Banner Section */}
      <div className="relative h-48 md:h-64 lg:h-72 overflow-hidden">
        {user.bannerImage ? (
          <MediaRenderer
            src={user.bannerImage}
            alt="Profile Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[rgb(163,255,18)]/20 via-purple-500/20 to-blue-500/20" />
        )}

        {/* Banner overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Edit banner button (own profile only) */}
        {isOwnProfile && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 border-white/20 text-white hover:bg-black/70"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isUploadingBanner ? 'Uploading...' : 'Edit Banner'}
            </Button>
          </>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 md:px-8 pb-6 -mt-16">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-black overflow-hidden bg-black">
              {user.profilePicture ? (
                <MediaRenderer
                  src={user.profilePicture}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-600 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-black">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Edit avatar button (own profile only) */}
            {isOwnProfile && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center hover:bg-[rgb(163,255,18)]/90 transition-colors disabled:opacity-50"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="w-4 h-4 text-black" />
                </button>
              </>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            {/* Name and verification */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
                {displayName}
              </h1>
              {isVerified && (
                <Badge className="bg-[rgb(163,255,18)]/20 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]">
                  <Verified className="w-3 h-3 mr-1" />
                  Verified Creator
                </Badge>
              )}
            </div>

            {/* Wallet address */}
            <button
              onClick={copyAddress}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-3"
            >
              <span className="font-mono text-sm">{shortAddress}</span>
              {copied ? (
                <CheckCircle className="w-4 h-4 text-[rgb(163,255,18)]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Bio */}
            {user.bio && (
              <p className="text-white/70 text-sm md:text-base mb-4 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Social links */}
            {user.socials && user.socials.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                {user.socials.map((social) => {
                  const Icon = socialIcons[social.platform] || Globe;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-[rgb(163,255,18)] transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={onEditProfile}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  className={cn(
                    isFollowing
                      ? 'border-white/20 text-white hover:bg-red-500/20 hover:border-red-500 hover:text-red-500'
                      : 'bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90'
                  )}
                  onClick={handleFollowClick}
                  disabled={followLoading}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-6 md:gap-8 mt-6 pt-6 border-t border-white/10"
        >
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-white">{stats.nftsOwned}</p>
            <p className="text-xs md:text-sm text-white/60">Items</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-white">{stats.collectionsOwned}</p>
            <p className="text-xs md:text-sm text-white/60">Created</p>
          </div>
          {stats.volumeTraded && (
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{stats.volumeTraded}</p>
              <p className="text-xs md:text-sm text-white/60">Volume</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-white">{stats.followers}</p>
            <p className="text-xs md:text-sm text-white/60">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-white">{stats.following}</p>
            <p className="text-xs md:text-sm text-white/60">Following</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
