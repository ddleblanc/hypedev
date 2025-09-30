"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles, Coins, Activity, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { StatCard } from "./stat-card";
import { Collection } from "./types";

interface OverviewTabProps {
  collection: Collection;
}

export function OverviewTab({ collection }: OverviewTabProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(collection.contractAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const stats = [
    { title: "Floor Price", value: `${collection.stats.floorPrice} ETH`, change: collection.stats.volumeChange24h, icon: Coins },
    { title: "24h Volume", value: `${collection.stats.volume24h} ETH`, change: collection.stats.volumeChange24h, icon: Activity },
    { title: "7d Volume", value: `${collection.stats.volume7d} ETH`, change: collection.stats.volumeChange7d, icon: TrendingUp },
    { title: "Market Cap", value: `${collection.stats.marketCap} ETH`, icon: DollarSign },
    { title: "Listed", value: collection.stats.listedCount.toLocaleString(), change: collection.stats.listedPercentage, icon: ShoppingCart },
    { title: "Unique Owners", value: collection.stats.uniqueOwners.toLocaleString(), icon: Users }
  ];

  return (
    <TabsContent value="overview" className="mt-0 space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
            />
          </motion.div>
        ))}
      </div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">About {collection.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/80 leading-relaxed">
              {collection.longDescription}
            </p>

            <Separator className="bg-white/10" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-white/60">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-white font-mono">
                    {collection.contractAddress.slice(0, 6)}...{collection.contractAddress.slice(-4)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white/60 hover:text-white"
                    onClick={copyAddress}
                  >
                    {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-white/60">Blockchain</p>
                <p className="text-sm text-white font-medium">{collection.blockchain}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-white/60">Token Standard</p>
                <p className="text-sm text-white font-medium">{collection.tokenStandard}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-white/60">Creator Royalty</p>
                <p className="text-sm text-white font-medium">{collection.stats.royalty}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Traits Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Traits & Rarity</CardTitle>
            <CardDescription className="text-white/60">
              Distribution of traits across the collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collection.traits.map((trait, index) => (
                <motion.div
                  key={trait.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="space-y-3"
                >
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[rgb(163,255,18)]" />
                    {trait.name}
                  </h4>
                  <div className="space-y-2">
                    {trait.values.map((value) => (
                      <div key={value.trait} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-white/80">{value.trait}</span>
                          <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                            {value.count}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={value.percentage}
                            className="w-24 h-2 bg-white/10"
                          />
                          <span className="text-xs text-white/60 w-12 text-right">
                            {value.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TabsContent>
  );
}
