"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
  Filter,
  Shield,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// =============================================================================
// Types
// =============================================================================

interface Application {
  id: string;
  userId: string;
  creatorType: string;
  displayName: string;
  tagline: string | null;
  bio: string;
  avatar: string | null;
  banner: string | null;
  skills: string[];
  portfolio: string | null;
  achievements: string | null;
  socialLinks: Record<string, string> | null;
  contentTypes: string[];
  uploadFrequency: string;
  targetAudience: string;
  uniqueValue: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  user: {
    id: string;
    walletAddress: string;
    username: string | null;
    profilePicture: string | null;
    createdAt: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// =============================================================================
// Admin Wallet Check
// =============================================================================

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES || "")
  .split(",")
  .map((addr) => addr.trim().toLowerCase())
  .filter(Boolean);

function useIsAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) return { isAdmin: false, isLoading: true };
  if (!user) return { isAdmin: false, isLoading: false };

  const isAdmin = ADMIN_WALLETS.includes(user.walletAddress.toLowerCase());
  return { isAdmin, isLoading: false };
}

// =============================================================================
// Component
// =============================================================================

export default function AdminCreatorApplicationsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(pagination?.page || 1),
        limit: "20",
      });
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/creator-applications?${params}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications);
        setPagination(data.data.pagination);
        setCounts(data.data.counts);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch applications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, pagination?.page, searchQuery, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin, statusFilter, fetchApplications]);

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedApp) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/creator-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Application ${action === "approve" ? "approved" : "rejected"} successfully`,
        });
        setSelectedApp(null);
        setReviewNotes("");
        setActionType(null);
        fetchApplications();
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} application`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} application`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(163,255,18)]" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-white/60">
            You do not have permission to access this page. This area is restricted to platform administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-10 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-red-500 text-white font-bold">ADMIN</Badge>
            <Badge variant="outline" className="border-white/20 text-white/60">
              Creator Verification
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Creator Applications</h1>
          <p className="text-white/60">Review and manage creator verification requests</p>
        </div>

        {/* Stats Cards */}
        {counts && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.pending}</p>
                    <p className="text-xs text-white/60">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.approved}</p>
                    <p className="text-xs text-white/60">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.rejected}</p>
                    <p className="text-xs text-white/60">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.total}</p>
                    <p className="text-xs text-white/60">Total Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-500">
                Pending
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search by name, wallet, username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchApplications()}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchApplications()}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Applications List */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full bg-white/10" />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center">
                <Filter className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Applications Found</h3>
                <p className="text-white/60">
                  {statusFilter === "pending"
                    ? "No pending applications to review"
                    : "No applications match your search criteria"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                          {app.avatar ? (
                            <img
                              src={app.avatar}
                              alt={app.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{app.displayName}</h3>
                            <Badge variant="outline" className="text-xs capitalize border-white/20 text-white/60">
                              {app.creatorType.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-white/60">
                            {app.user.username ? `@${app.user.username}` : app.user.walletAddress.slice(0, 10) + "..."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge
                            className={
                              app.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : app.status === "approved"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-400"
                            }
                          >
                            {app.status}
                          </Badge>
                          <p className="text-xs text-white/40 mt-1">
                            {format(new Date(app.submittedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={pagination.page === i + 1 ? "default" : "outline"}
                onClick={() => setPagination({ ...pagination, page: i + 1 })}
                className={pagination.page === i + 1 ? "bg-[rgb(163,255,18)] text-black" : "border-white/20 text-white"}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="bg-[#111] border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {selectedApp.avatar ? (
                      <img
                        src={selectedApp.avatar}
                        alt={selectedApp.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  {selectedApp.displayName}
                  <Badge className="capitalize">{selectedApp.creatorType.replace("_", " ")}</Badge>
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  {selectedApp.tagline || "No tagline provided"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Bio */}
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-1">Bio</h4>
                  <p className="text-white text-sm">{selectedApp.bio}</p>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-white/10 text-white/80">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Content Types */}
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-2">Content Types</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.contentTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="bg-purple-500/20 text-purple-300">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-1">Target Audience</h4>
                  <p className="text-white text-sm">{selectedApp.targetAudience}</p>
                </div>

                {/* Upload Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-white/40 mb-1">Upload Frequency</h4>
                    <p className="text-white text-sm capitalize">{selectedApp.uploadFrequency}</p>
                  </div>
                  {selectedApp.portfolio && (
                    <div>
                      <h4 className="text-sm font-medium text-white/40 mb-1">Portfolio</h4>
                      <a
                        href={selectedApp.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[rgb(163,255,18)] text-sm hover:underline inline-flex items-center gap-1"
                      >
                        View Portfolio <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Achievements */}
                {selectedApp.achievements && (
                  <div>
                    <h4 className="text-sm font-medium text-white/40 mb-1">Achievements</h4>
                    <p className="text-white text-sm">{selectedApp.achievements}</p>
                  </div>
                )}

                {/* Unique Value */}
                {selectedApp.uniqueValue && (
                  <div>
                    <h4 className="text-sm font-medium text-white/40 mb-1">What Makes Them Unique</h4>
                    <p className="text-white text-sm">{selectedApp.uniqueValue}</p>
                  </div>
                )}

                {/* User Info */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-medium text-white/40 mb-2">User Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/40">Wallet:</span>{" "}
                      <span className="text-white font-mono">{selectedApp.user.walletAddress.slice(0, 10)}...</span>
                    </div>
                    <div>
                      <span className="text-white/40">Username:</span>{" "}
                      <span className="text-white">{selectedApp.user.username || "Not set"}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Account Created:</span>{" "}
                      <span className="text-white">{format(new Date(selectedApp.user.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Applied:</span>{" "}
                      <span className="text-white">{format(new Date(selectedApp.submittedAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>

                {/* Previous Review Notes */}
                {selectedApp.reviewNotes && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white/40 mb-1">Previous Review Notes</h4>
                    <p className="text-white text-sm">{selectedApp.reviewNotes}</p>
                  </div>
                )}

                {/* Review Form (only for pending) */}
                {selectedApp.status === "pending" && (
                  <div className="border-t border-white/10 pt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        Review Notes (optional for approval, recommended for rejection)
                      </label>
                      <Textarea
                        placeholder="Add notes about your decision..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedApp.status === "pending" && (
                <DialogFooter className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionType("reject");
                    }}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={isSubmitting}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleReview("approve")}
                    className="bg-green-500 text-white hover:bg-green-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={() => setActionType(null)}>
        <DialogContent className="bg-[#111] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Rejection
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to reject this application? The applicant will be notified and can reapply.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-white mb-2 block">
              Rejection Reason (recommended)
            </label>
            <Textarea
              placeholder="Provide feedback to help the applicant improve..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionType(null)}
              className="border-white/20 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleReview("reject")}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
