"use client";

import { useState } from "react";
import { Calendar, MapPin, Phone, CheckCircle2, Clock, Map, Search, Filter } from "lucide-react";
import { PageHeader } from "./PageHeader";

interface BookingsClientProps {
  initialBookings: any[];
}

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const [bookings] = useState(initialBookings);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (b.customer_name || "").toLowerCase().includes(q) ||
      (b.mobile_number || "").toLowerCase().includes(q);
    return matchSearch;
  });

  const pending = bookings.filter((b) => !b.completed_at).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        icon={Calendar}
        title="Site Visits"
        description="All technician visit bookings raised from customer quote confirmations."
        badge={`${pending} Pending`}
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder-zinc-400 dark:placeholder-zinc-700"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Pending", value: pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Via Referral", value: bookings.filter(b => b.promoter_name).length, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { label: "Direct / Organic", value: bookings.filter(b => !b.promoter_name).length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4`}>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-lg dark:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Referred by</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">No site visits found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-all group/row">
                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-white">
                            {new Date(booking.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">
                            {new Date(booking.created_at).getFullYear()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors">
                        {booking.customer_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-300 dark:text-zinc-700" />
                        {booking.mobile_number}
                      </div>
                    </td>

                    {/* Referral */}
                    <td className="px-6 py-4">
                      {booking.promoter_name ? (
                        <div>
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20">
                            {booking.promoter_name}
                          </span>
                          {booking.promoter_business && (
                            <p className="text-[9px] text-zinc-400 mt-1 font-medium">{booking.promoter_business}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">Direct / Organic</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      {booking.address ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {booking.address.pincode}
                            </div>
                            {booking.address.landmark1 && (
                              <div className="text-[10px] text-zinc-400 font-medium mt-0.5 max-w-[140px] truncate">
                                {booking.address.landmark1}
                              </div>
                            )}
                          </div>
                          {booking.address.coordinates && (
                            <a
                              href={`https://www.google.com/maps?q=${booking.address.coordinates.lat},${booking.address.coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all"
                              title="Open in Google Maps"
                            >
                              <Map className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">Not provided</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 text-[9px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Visit
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
