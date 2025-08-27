export default function ExplorePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <h2 className="text-2xl font-bold">Explore NFTs</h2>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Coming Soon</p>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Discovery Features</p>
        </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Explore Page</h3>
          <p className="text-muted-foreground">Browse and discover amazing NFTs</p>
        </div>
      </div>
    </div>
  );
}