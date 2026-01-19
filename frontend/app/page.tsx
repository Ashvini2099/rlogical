// app/events/page.tsx
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EventsList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/events')
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
      <div className="grid gap-4">
        {events.map((event: any) => (
          <div key={event.id} className="border p-4 rounded shadow-sm">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <p className="text-gray-600">{event.date}</p>
            <Link href={`/events/${event.id}`} className="text-blue-500 mt-2 inline-block">
              View Availability & Book →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}