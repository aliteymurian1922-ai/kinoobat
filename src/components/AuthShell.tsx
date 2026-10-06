import Wordmark from "@/components/Wordmark";

export default function AuthShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Wordmark />
      <div className="ticket-in ticket mt-8 p-6">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-1 mb-5 text-sm text-muted">{sub}</p>
        {children}
      </div>
    </main>
  );
}
