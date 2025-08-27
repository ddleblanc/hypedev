import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CollectionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <h2 className="text-2xl font-bold">Collections</h2>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Top Collections</p>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Trending</p>
        </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold mb-2">Collections Overview</h3>
          <p className="text-muted-foreground mb-4">Discover amazing NFT collections</p>
          <Button asChild>
            <Link href="/collection/cyber-warriors">
              View Cyber Warriors Collection
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}