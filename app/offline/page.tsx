export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-primary/5 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="m2 2 20 20"/>
          <path d="M8.53 8.53C5.52 9.61 2.92 11.53 1 14l2 2.66c1.6-1.57 3.56-2.6 5.68-3.05"/>
          <path d="M16 16.5c-2.02-.97-4.22-1.5-6.5-1.5-.78 0-1.54.08-2.29.23"/>
          <path d="M23 14c-1.92-2.47-4.52-4.39-7.53-5.47"/>
          <path d="M11 6c-2.48 0-4.87.5-7 1.4"/>
          <path d="M18.8 8.8A15.9 15.9 0 0 0 11 6.5"/>
        </svg>
      </div>
      <h1 className="text-3xl font-black text-foreground mb-4">You are Offline</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
        It looks like you've lost your internet connection. Please check your network settings and try again. 
      </p>
      
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground mb-3">Contact Support</h2>
        <p className="text-sm text-muted-foreground mb-4">
          If you need immediate assistance regarding a quote or installation, please call us directly.
        </p>
        <a 
          href="tel:+919772699395" 
          className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors"
        >
          Call +91 97726 99395
        </a>
      </div>
    </div>
  );
}
