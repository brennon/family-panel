import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          Welcome to Family Panel
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Family organization and coordination platform
        </p>
        <div className="flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </main>
  );
}
