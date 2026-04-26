"use client";

import { useState } from "react";
import { Calendar, MapPin, User, Phone, CheckCircle2, Clock, Map } from "lucide-react";

interface BookingsClientProps {
  initialBookings: unknown[];
}

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const [bookings] = useState(initialBookings);

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 font-black uppercase text-[10px] tracking-[0.25em]">
            <tr>
              <th className="px-8 py-6">Technician Visit Info</th>
              <th className="px-8 py-6">Customer Details</th>
              <th className="px-8 py-6">Pinpoint Location</th>
              <th className="px-8 py-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-32 text-center text-zinc-500 font-black uppercase tracking-widest">
                   No Site Visits Booked
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-500">
                          <Clock className="w-6 h-6" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Created At</div>
                          <div className="text-zinc-900 dark:text-white font-black">
                             {new Date(booking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-black">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          Lead ID: {booking.lead_id?.substring(0, 8)}...
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                          <Phone className="w-3 h-3" />
                          Refer to CRM for contact
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {booking.address ? (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="text-zinc-900 dark:text-white text-[11px] font-black tracking-widest uppercase flex items-center gap-2">
                             <MapPin className="w-3.5 h-3.5 text-blue-500" /> {booking.address.pincode}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1 truncate max-w-[200px]">
                             {booking.address.landmark1}
                          </div>
                        </div>
                        {booking.address.coordinates && (
                           <a 
                             href={`https://www.google.com/maps?q=${booking.address.coordinates.lat},${booking.address.coordinates.lng}`}
                             target="_blank"
                             className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-all"
                           >
                              <Map className="w-4 h-4" />
                           </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-800 text-[10px] font-black uppercase">Unlinked</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/10 text-[9px] font-black uppercase tracking-widest">
                       <CheckCircle2 className="w-3 h-3" /> Pending Visit
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
