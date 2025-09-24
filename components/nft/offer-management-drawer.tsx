"use client";

import { useState } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Tag, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Crown,
  Calendar,
  DollarSign
} from "lucide-react";

interface Offer {
  id: string;
  nft: {
    id: string;
    name: string;
    image: string;
    collection: string;
    rarity: string;
  };
  amount: number;
  status: "active" | "accepted" | "rejected" | "expired" | "cancelled";
  expiresAt: Date;
  createdAt: Date;
  floorDiff?: number;
}

interface Bid {
  id: string;
  nft: {
    id: string;
    name: string;
    image: string;
    collection: string;
    rarity: string;
  };
  amount: number;
  bidder: string;
  status: "active" | "accepted" | "rejected" | "expired";
  expiresAt: Date;
  createdAt: Date;
  isHighest?: boolean;
}

export interface OfferManagementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_OFFERS: Offer[] = [
  {
    id: "1",
    nft: {
      id: "nft1",
      name: "Cosmic Dragon #1234",
      image: "https://picsum.photos/1200/400",
      collection: "Cosmic Dragons",
      rarity: "Legendary"
    },
    amount: 2.5,
    status: "active",
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    floorDiff: -15
  },
  {
    id: "2",
    nft: {
      id: "nft2",
      name: "Pixel Warrior #5678",
      image: "https://picsum.photos/1200/400",
      collection: "Pixel Warriors",
      rarity: "Epic"
    },
    amount: 1.8,
    status: "expired",
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    floorDiff: 5
  },
];

const MOCK_BIDS: Bid[] = [
  {
    id: "1",
    nft: {
      id: "nft3",
      name: "Space Explorer #9999",
      image: "https://picsum.photos/1200/400",
      collection: "Space Explorers",
      rarity: "Mythic"
    },
    amount: 4.2,
    bidder: "0x1234...5678",
    status: "active",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isHighest: true
  },
  {
    id: "2",
    nft: {
      id: "nft4",
      name: "Crystal Guardian #0001",
      image: "https://picsum.photos/1200/400",
      collection: "Crystal Guardians",
      rarity: "Legendary"
    },
    amount: 3.1,
    bidder: "0xabcd...efgh",
    status: "active",
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    isHighest: false
  },
];

export function OfferManagementDrawer({ open, onOpenChange }: OfferManagementDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("offers");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4 text-green-600" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return `${minutes}m remaining`;
  };

  const filteredOffers = MOCK_OFFERS.filter(offer => {
    const matchesSearch = offer.nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.nft.collection.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBids = MOCK_BIDS.filter(bid => {
    const matchesSearch = bid.nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.nft.collection.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Offers & Bids Management
          </DrawerTitle>
          <DrawerDescription>
            Manage your active offers and incoming bids
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="offers">My Offers ({MOCK_OFFERS.length})</TabsTrigger>
                <TabsTrigger value="bids">Received Bids ({MOCK_BIDS.length})</TabsTrigger>
              </TabsList>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search NFTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="offers" className="flex-1 overflow-hidden">
              <div className="space-y-3 h-full overflow-y-auto pr-2">
                {filteredOffers.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No offers found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filters" 
                          : "Start making offers on NFTs you're interested in"}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredOffers.map((offer) => (
                    <div key={offer.id} className="p-4 border rounded-lg bg-card space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <MediaRenderer src={offer.nft.image} alt={offer.nft.name} className="" aspectRatio="square" />
                          {(offer.nft.rarity === "Legendary" || offer.nft.rarity === "Mythic") && (
                            <Crown className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{offer.nft.name}</h4>
                          <p className="text-sm text-muted-foreground">{offer.nft.collection}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {offer.nft.rarity}
                            </Badge>
                            {offer.floorDiff && (
                              <div className={`flex items-center gap-1 text-xs ${
                                offer.floorDiff > 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {offer.floorDiff > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {Math.abs(offer.floorDiff)}% vs Floor
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-lg">{offer.amount} ETH</div>
                          <div className="text-xs text-muted-foreground">
                            ~${(offer.amount * 2500).toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(offer.status)}
                          {getStatusBadge(offer.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {offer.status === "active" ? formatTimeRemaining(offer.expiresAt) : ""}
                        </div>
                      </div>

                      {offer.status === "active" && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" className="flex-1">
                            Cancel Offer
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Modify
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="bids" className="flex-1 overflow-hidden">
              <div className="space-y-3 h-full overflow-y-auto pr-2">
                {filteredBids.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No bids found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filters" 
                          : "Bids on your NFTs will appear here"}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredBids.map((bid) => (
                    <div key={bid.id} className="p-4 border rounded-lg bg-card space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <MediaRenderer src={bid.nft.image} alt={bid.nft.name} className="" aspectRatio="square" />
                          {(bid.nft.rarity === "Legendary" || bid.nft.rarity === "Mythic") && (
                            <Crown className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{bid.nft.name}</h4>
                          <p className="text-sm text-muted-foreground">{bid.nft.collection}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {bid.nft.rarity}
                            </Badge>
                            {bid.isHighest && (
                              <Badge variant="default" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                                Highest Bid
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-lg">{bid.amount} ETH</div>
                          <div className="text-xs text-muted-foreground">
                            from {bid.bidder.substring(0, 6)}...{bid.bidder.substring(bid.bidder.length - 4)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(bid.status)}
                          {getStatusBadge(bid.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {bid.status === "active" ? formatTimeRemaining(bid.expiresAt) : ""}
                        </div>
                      </div>

                      {bid.status === "active" && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" className="flex-1">
                            Reject
                          </Button>
                          <Button size="sm" className="flex-1">
                            Accept Bid
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DrawerFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}