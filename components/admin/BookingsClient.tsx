"use client";

import { useState } from "react";
import { Calendar, MapPin, Phone, CheckCircle2, Clock, Map, Search, Filter } from "lucide-react";
import { PageHeader } from "./PageHeader";

import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full bg-background border-border shadow-sm text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length },
          { label: "Pending", value: pending },
          { label: "Via Referral", value: bookings.filter(b => b.promoter_name).length },
          { label: "Direct / Organic", value: bookings.filter(b => !b.promoter_name).length },
        ].map((s) => (
          <Card key={s.label} className="p-4 bg-card border-border shadow-sm flex flex-col justify-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-xs tracking-wider">Scheduled Visit</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">Customer</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">Address & Notes</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">Source / Referral</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider text-center">Status</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="w-8 h-8 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No site visits found</p>
                      <p className="text-xs">Try adjusting your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((booking) => {
                  const visitDate = booking.preferred_date || booking.site_visit_date || booking.created_at;
                  const timeSlot = booking.time_slot || "10:00 AM - 01:00 PM";
                  const rawAddress = booking.address;
                  const fullAddressStr = typeof rawAddress === "string" 
                    ? rawAddress 
                    : rawAddress?.full_address || rawAddress?.street || "Address provided during confirmation";
                  const pincode = typeof rawAddress === "object" ? rawAddress?.pincode : "";

                  return (
                    <TableRow key={booking.id} className="group/row hover:bg-muted/30 transition-colors">
                      
                      {/* Scheduled Visit */}
                      <TableCell className="align-top py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">
                              {visitDate ? new Date(visitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date TBD"}
                            </span>
                            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 mt-0.5">
                              ⏰ {timeSlot}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              Booked: {new Date(booking.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="align-top py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-foreground text-sm tracking-tight">
                            {booking.customer_name}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{booking.customer_mobile || booking.mobile_number}</span>
                          </div>
                          {booking.customer_mobile && (
                            <a
                              href={`https://wa.me/91${booking.customer_mobile.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${booking.customer_name}, this is regarding your Free Site Survey booking with TEAM CCTV scheduled for ${visitDate}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 mt-0.5"
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Address & Notes */}
                      <TableCell className="align-top py-4 max-w-xs">
                        <div className="flex flex-col gap-1.5 text-xs">
                          <div className="flex items-start gap-1.5 text-foreground font-medium">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{fullAddressStr}</span>
                          </div>
                          {pincode && (
                            <span className="text-[11px] text-muted-foreground font-semibold">PIN: {pincode}</span>
                          )}
                          {booking.special_notes && (
                            <div className="p-1.5 bg-muted/60 rounded text-[11px] text-muted-foreground italic border">
                              Note: "{booking.special_notes}"
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Source / Referral */}
                      <TableCell className="align-top py-4">
                        {booking.promoter_name ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit text-[10px] uppercase border-warning/50 text-warning bg-warning/10 font-bold">
                              {booking.promoter_name}
                            </Badge>
                            {booking.promoter_business && (
                              <span className="text-xs text-muted-foreground font-medium truncate max-w-[140px]">
                                {booking.promoter_business}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">🌐 Direct Website</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top py-4 text-center">
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 font-bold gap-1.5 h-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                            Site Visit Booked
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-top py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {booking.lead_id && (
                            <a
                              href={`/admin/leads/${booking.lead_id}`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-border text-xs font-bold hover:bg-muted transition-colors"
                            >
                              Lead Details
                            </a>
                          )}
                          <a
                            href="/admin/dispatch"
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors"
                          >
                            Dispatch
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
