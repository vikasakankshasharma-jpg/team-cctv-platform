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
                <TableHead className="font-semibold text-xs tracking-wider">Date</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">Customer</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">Referred by</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">Location</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="w-8 h-8 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No site visits found</p>
                      <p className="text-xs">Try adjusting your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((booking) => (
                  <TableRow key={booking.id} className="group/row hover:bg-muted/30 transition-colors">
                    
                    {/* Date */}
                    <TableCell className="align-top py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {new Date(booking.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(booking.created_at).getFullYear()}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground text-sm tracking-tight group-hover/row:text-primary transition-colors">
                          {booking.customer_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Phone className="w-3 h-3" />
                          {booking.mobile_number}
                        </div>
                      </div>
                    </TableCell>

                    {/* Referral */}
                    <TableCell className="align-top py-4">
                      {booking.promoter_name ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit text-[10px] uppercase border-warning/50 text-warning bg-warning/10">
                            {booking.promoter_name}
                          </Badge>
                          {booking.promoter_business && (
                            <span className="text-xs text-muted-foreground font-medium truncate max-w-[140px]">
                              {booking.promoter_business}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground italic">Direct / Organic</span>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell className="align-top py-4">
                      {booking.address ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {booking.address.pincode}
                            </div>
                            {booking.address.landmark1 && (
                              <div className="text-xs text-muted-foreground truncate max-w-[140px]" title={booking.address.landmark1}>
                                {booking.address.landmark1}
                              </div>
                            )}
                          </div>
                          {booking.address.coordinates && (
                            <a
                              href={`https://www.google.com/maps?q=${booking.address.coordinates.lat},${booking.address.coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground rounded-md transition-all shadow-sm shrink-0"
                              title="Open in Google Maps"
                            >
                              <Map className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground italic">Not provided</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top py-4 text-center">
                      <div className="flex justify-center">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 gap-1.5 h-6">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending Visit
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
