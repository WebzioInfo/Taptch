import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from('todos').select();

  return (
    <div className="min-h-screen p-8 bg-white text-slate-900">
      <h1 className="text-xl font-bold mb-4">Supabase Todos</h1>
      <ul className="space-y-2">
        {todos?.map((todo: any) => (
          <li key={todo.id} className="p-2 border rounded">
            {todo.name || todo.title || JSON.stringify(todo)}
          </li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="text-sm text-slate-500 mt-2">No todos found or &apos;todos&apos; table is empty.</p>
      )}
    </div>
  );
}

