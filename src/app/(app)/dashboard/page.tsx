import { db } from "@/database/index";
import { TimelineViewer } from "@/components/TimelineViewer";

export default async function HomePage() {
  const allUsers = await db.query.users.findMany({
    orderBy: (users, { asc }) => [asc(users.fullName)],
  });

  return (
    <main className="p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Campus Security Dashboard</h1>
        <p className="text-lg text-gray-600">
          Select an entity to view their activity timeline.
        </p>
      </header>
      <TimelineViewer users={allUsers} />
    </main>
  );
}
