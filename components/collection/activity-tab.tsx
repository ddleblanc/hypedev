"use client";

import { RefreshCw } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collection } from "./types";

interface ActivityTabProps {
  collection: Collection;
}

export function ActivityTab({ collection }: ActivityTabProps) {
  return (
    <TabsContent value="activity" className="mt-0 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-white/60 p-4">Event</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">Item</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">Price</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">From</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">To</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {collection.recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <Badge className={`${
                        activity.type === 'Sale' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'List' ? 'bg-blue-500/20 text-blue-400' :
                        activity.type === 'Transfer' ? 'bg-purple-500/20 text-purple-400' :
                        activity.type === 'Offer' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {activity.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">{activity.item}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[rgb(163,255,18)] font-bold">{activity.price} ETH</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white/80 font-mono text-sm">{activity.from}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white/80 font-mono text-sm">{activity.to}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white/60 text-sm">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
