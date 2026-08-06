import { getPublishedEvents } from "@/lib/events";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Events from Notion as a chronological list.
 * No calendar library — just a simple ordered list.
 */
export default async function CalendarPage() {
  const events = await getPublishedEvents();

  return (
    <main className="homepage">
      <h1>Calendar</h1>
      <p className="homepage-subtitle">
        Upcoming neurology events, conferences, and courses.
      </p>

      {events.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published events yet. Add one in Notion with Status = Published.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {events.map((event) => (
            <li key={event.id} className="border-b border-neutral-200 pb-4">
              {event.url ? (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-blue-700 underline hover:no-underline"
                >
                  {event.name}
                </a>
              ) : (
                <h2 className="text-xl font-semibold">{event.name}</h2>
              )}

              {event.date ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Date: {event.date}
                </p>
              ) : null}

              {event.eventType ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Type: {event.eventType}
                </p>
              ) : null}

              {event.location ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Location: {event.location}
                </p>
              ) : null}

              {event.onlineOrInPerson ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Format: {event.onlineOrInPerson}
                </p>
              ) : null}

              {event.organizer ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Organizer: {event.organizer}
                </p>
              ) : null}

              {event.language ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Language: {event.language}
                </p>
              ) : null}

              {event.description ? (
                <p className="mt-2 text-neutral-700">{event.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
