# 🎟️ Event Ticket Booking System

A full-stack ticket booking application built with Node.js (Express), TypeScript, MySQL, and Next.js. Features include nested event structures, real-time availability tracking, atomic transactions to prevent overbooking, and group discounts.

🚀 Features
Hierarchical Events: Create events with multiple sections and rows.

Atomic Bookings: Database transactions with FOR UPDATE locks to prevent race conditions during seat selection.

Automatic Discounts: 4+ tickets automatically triggers a groupDiscount flag.

Real-time UI: Built-in toaster notifications and dynamic seat availability.

# 🛠️ Tech Stack
Backend: Node.js, Express, TypeScript, MySQL (mysql2/promise).

Frontend: Next.js (App Router), Tailwind CSS, React Hot Toast.

Database: Relational MySQL schema.

# ⚙️ Backend Setup (Node.js)
Install Dependencies:
npm install

Database Configuration: Create a MySQL database and run the following schema to establish the structure:
CREATE TABLE events (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), date DATETIME, location VARCHAR(255));
CREATE TABLE sections (id INT AUTO_INCREMENT PRIMARY KEY, event_id INT, name VARCHAR(50), price DECIMAL(10,2), total_seats INT, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);
CREATE TABLE seat_rows (id INT AUTO_INCREMENT PRIMARY KEY, section_id INT, row_label VARCHAR(10), total_seats INT, FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE);
CREATE TABLE bookings (id INT AUTO_INCREMENT PRIMARY KEY, event_id INT, section_id INT, seat_row_id INT, tickets INT, total_amount DECIMAL(10,2), discount_applied BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (seat_row_id) REFERENCES seat_rows(id));


# Creating an Event
Endpoint: POST /api/events
{
  "name": "Concert XYZ",
  "date": "2025-07-10T19:00:00Z",
  "sections": [
    {
      "name": "Section A",
      "rows": [
        { "name": "Row 1", "totalSeats": 10 },
        { "name": "Row 2", "totalSeats": 8 }
      ]
    },
    {
      "name": "Section B",
      "rows": [
        { "name": "Row 1", "totalSeats": 6 }
      ]
    }
  ]
}

Run the Server:
# nodemon server.ts

# 💻 Frontend Setup (Next.js)
Install Dependencies:
npm install

Run Development Mode:
# npm run dev

📡 API Reference
Endpoint,Method,Description
/api/events,GET,Lists all basic event details.
/api/events/:id/availability,GET,Returns available seats for each section/row.
/api/events/:id/purchase,POST,Performs booking transaction with availability check.
/api/events,POST,Creates a new event with nested sections and rows.