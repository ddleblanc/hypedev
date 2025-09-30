"use client";

import { ExternalLink } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collection } from "./types";

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
                {collection.topHolders.map((holder, index) => (
                  <div key={holder.address} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-mono text-sm">{holder.address}</p>
                        <p className="text-white/60 text-xs">
                          {holder.amount} items ({holder.percentage}%)
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Total Holders</span>
                  <span className="text-sm font-bold text-white">
                    {collection.stats.owners.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Unique Holders</span>
                  <span className="text-sm font-bold text-white">
                    {collection.stats.uniqueOwners.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Average per Holder</span>
                  <span className="text-sm font-bold text-white">
                    {(collection.stats.totalSupply / collection.stats.owners).toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-2">
                <p className="text-sm text-white/60 mb-2">Holder Growth</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">24h</span>
                  <span className="text-xs text-green-400">+2.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">7d</span>
                  <span className="text-xs text-green-400">+5.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">30d</span>
                  <span className="text-xs text-green-400">+12.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}
