"use client";

import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collection } from "./types";
import { RankBadge } from "@/components/shared/rank-badge";
import { AnimatedCounter, formatCompactNumber } from "@/components/shared/animated-counter";

interface HoldersTabProps {
  collection: Collection;
}

export function HoldersTab({ collection }: HoldersTabProps) {
  return (
    <TabsContent value="holders" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Holders List */}
        <div className="lg:col-span-2">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Top Holders</CardTitle>
              <CardDescription className="text-white/60">
                Largest holders in the collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(collection.topHolders || []).map((holder, index) => (
                  <motion.div
                    key={holder.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <RankBadge rank={index + 1} size="md" showIcon={index < 3} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-mono text-sm group-hover:text-[rgb(163,255,18)] transition-colors">
                          {holder.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/80 text-xs font-medium">
                            {holder.amount} items
                          </span>
                          <span className="text-white/40">•</span>
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400"
                                style={{ width: `${holder.percentage}%` }}
                              />
                            </div>
                            <span className="text-white/60 text-xs">
                              {holder.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holder Stats */}
        <div>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Holder Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Total Holders</span>
                  <AnimatedCounter
                    value={collection.stats.owners}
                    formatFn={formatCompactNumber}
                    className="text-sm font-bold text-white"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Unique Holders</span>
                  <AnimatedCounter
                    value={collection.stats.uniqueOwners}
                    formatFn={formatCompactNumber}
                    className="text-sm font-bold text-white"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Average per Holder</span>
                  <AnimatedCounter
                    value={collection.stats.owners > 0 ? collection.stats.totalSupply / collection.stats.owners : 0}
                    decimals={2}
                    className="text-sm font-bold text-white"
                  />
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-white font-medium">Holder Growth</p>
                </div>
                <div className="space-y-2">
                  {[
                    { period: "24h", change: 2.3 },
                    { period: "7d", change: 5.8 },
                    { period: "30d", change: 12.4 },
                  ].map((item) => (
                    <div key={item.period} className="flex items-center justify-between">
                      <span className="text-xs text-white/60">{item.period}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                            style={{ width: `${Math.min(item.change * 5, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-400 font-medium">+{item.change}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}
