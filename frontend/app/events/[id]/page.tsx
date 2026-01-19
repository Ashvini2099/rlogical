"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EventBooking() {
    const { id } = useParams();
    const [tickets, setTickets] = useState(1);
    const [availability, setAvailability] = useState([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Fetch availability on load
    useEffect(() => {
        fetch(`http://localhost:4000/events/${id}/availability`)
            .then(res => res.json())
            .then(data => setAvailability(data));
    }, [id]);

    const handlePurchase = async () => {
        if (!selectedRow) {
            return toast.error("Please select a section and row!");
        }

        // Define the promise
        const purchasePromise = fetch(`http://localhost:4000/events/${id}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            event_id: Number(id),
            section_id: selectedRow.sectionId,
            seat_row_id: selectedRow.rowId,
            tickets: Number(tickets)
            })
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Purchase failed");
            return data;
        });
        // Execute toast with the promise
        toast.promise(purchasePromise, {
            loading: 'Processing your tickets...',
            success: (data) => {
            // Logic for the group discount rule
            const msg = data.groupDiscount 
                ? "Success! 4+ Tickets: Group Discount Applied! 🎉" 
                : "Tickets booked successfully! 🎫";
            
            // Refresh availability after success
            setTimeout(() => window.location.reload(), 2000);
            return msg;
            },
            error: (err) => `Error: ${err.message}`,
        });
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Book Tickets</h1>

            <div className="mb-6">
                <label className="block mb-2">Number of Tickets:</label>&nbsp;&nbsp;
                <input
                    type="number" min="1" value={tickets}
                    onChange={(e) => setTickets(Number(e.target.value))}
                    className="border p-2 rounded w-20"
                />
                {tickets >= 4 && <span className="ml-4 text-green-600 font-bold">Group Discount Eligible!</span>}
            </div>

            <h5 className="font-semibold mb-2">Select a Section/Row:</h5>
            <div className="grid gap-2">
                {availability.map((row: any) => (
                    <button
                        key={row.rowId}
                        onClick={() => setSelectedRow(row)}
                        disabled={row.rowCapacity - row.bookedTickets < tickets}
                        className={`p-4 border rounded text-left ${selectedRow?.rowId === row.rowId ? 'border-blue-500 bg-blue-50' : ''
                            } ${row.rowCapacity - row.bookedTickets < tickets ? 'opacity-50 bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                        <strong>{row.sectionName}</strong> - {row.row_label}
                        <br />
                        <small>Available: {row.rowCapacity - row.bookedTickets} / {row.rowCapacity}</small>
                    </button>
                ))}
            </div>

            <button
                onClick={handlePurchase}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
                Purchase Tickets
            </button>
        </div>
    );
}