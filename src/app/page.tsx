export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
        <div className="flex flex-1 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-xs shadow-md">
            FX
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground uppercase">FluxX Command Center</span>
        </div>
        <nav className="flex gap-4">
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Operations</a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Intelligence</a>
        </nav>
      </header>

      <main className="flex-1 p-6 md:p-8 bg-background">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Global system status and active operations.</p>
          </div>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            Deploy Unit
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
            <div className="p-5 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Nodes</span>
              <span className="text-3xl font-bold tracking-tight text-foreground">1,248</span>
              <span className="text-xs text-primary mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                System nominal
              </span>
            </div>
          </div>
          <div className="rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive/80"></div>
            <div className="p-5 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anomalies Detected</span>
              <span className="text-3xl font-bold tracking-tight text-destructive">12</span>
              <span className="text-xs text-muted-foreground mt-2">Requires immediate attention</span>
            </div>
          </div>
          <div className="rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent/80"></div>
            <div className="p-5 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network Integrity</span>
              <span className="text-3xl font-bold tracking-tight text-foreground">99.8%</span>
              <span className="text-xs text-muted-foreground mt-2">+0.1% since last hour</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="p-5 border-b">
            <h3 className="text-sm font-medium">Recent Activity Log</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Timestamp</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Event ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Severity</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono">14:26:03.192Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9982-A</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/20 text-primary">INFO</span></td>
                  <td className="p-4 align-middle text-xs">Routine synchronization completed for sector 7G.</td>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono">14:15:42.005Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9981-D</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive/20 text-destructive">WARN</span></td>
                  <td className="p-4 align-middle text-xs">Latency spike detected in communication relay alpha.</td>
                </tr>
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono">13:58:11.753Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9980-C</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">DEBUG</span></td>
                  <td className="p-4 align-middle text-xs">Payload inspection trace completed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
