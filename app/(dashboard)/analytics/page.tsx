export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-base text-muted-foreground">
          Monitor NPC performance, player interactions, and content effectiveness
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-3">Total NPCs Generated</p>
          <p className="text-4xl font-bold text-foreground mb-2">247</p>
          <p className="text-sm text-accent font-medium">+12% from last week</p>
        </div>
        <div className="p-8 rounded-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-3">Avg Response Time</p>
          <p className="text-4xl font-bold text-foreground mb-2">87ms</p>
          <p className="text-sm text-accent font-medium">-5ms improvement</p>
        </div>
        <div className="p-8 rounded-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-3">Player Satisfaction</p>
          <p className="text-4xl font-bold text-foreground mb-2">4.7/5</p>
          <p className="text-sm text-accent font-medium">+0.3 from last month</p>
        </div>
      </div>
    </div>
  )
}
