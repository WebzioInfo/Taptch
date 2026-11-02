import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function SupabaseTestPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let todos: { id: string | number; name?: string; title?: string }[] | null = null;
  let errorMsg: string | null = null;

  try {
    const { data, error } = await supabase.from('todos').select();
    if (error) {
      errorMsg = error.message;
    } else {
      todos = data;
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Supabase Connectivity Test</h1>
              <p className="text-sm text-muted-foreground">Verification page for @supabase/ssr and client helpers</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary">
            Dev Utility
          </Badge>
        </div>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>Endpoint:</span>
              <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
              </code>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Query Status: {errorMsg}</div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    (Note: This is normal if the &apos;todos&apos; table hasn&apos;t been created yet in your Supabase project)
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Supabase Client Initialized Successfully
                </div>
                {todos && todos.length > 0 ? (
                  <ul className="divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden">
                    {todos.map((todo) => (
                      <li key={todo.id} className="p-3 text-sm flex items-center justify-between">
                        <span>{todo.name || todo.title || JSON.stringify(todo)}</span>
                        <Badge variant="secondary" className="text-xs">ID: {todo.id}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connected. No items found in the &apos;todos&apos; table.
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground">
              <span>Helper: <code>@/utils/supabase/server</code></span>
              <Link href="/dev/gallery">
                <Button variant="ghost" size="sm" className="text-xs">
                  Design System Gallery
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

