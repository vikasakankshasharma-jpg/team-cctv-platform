"use client";

import React, { useState } from "react";
import { CCTVRequirement } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface EditConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRequirement: CCTVRequirement;
  onUpdate: (newRequirement: CCTVRequirement) => void;
  isUpdating?: boolean;
}

export function EditConfigurationDrawer({
  isOpen,
  onClose,
  currentRequirement,
  onUpdate,
  isUpdating = false
}: EditConfigurationDrawerProps) {
  const [req, setReq] = useState<CCTVRequirement>(currentRequirement);

  const handleSave = () => {
    onUpdate(req);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
          <DialogDescription>
            Tweak your system requirements and see the price update instantly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label>Camera Quantity</Label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={() => setReq(prev => ({...prev, camera_count: Math.max(1, prev.camera_count - 1)}))}>-</Button>
              <Input 
                type="number" 
                value={req.camera_count} 
                onChange={(e) => setReq(prev => ({...prev, camera_count: parseInt(e.target.value) || 1}))}
                className="w-20 text-center"
              />
              <Button variant="outline" size="icon" onClick={() => setReq(prev => ({...prev, camera_count: prev.camera_count + 1}))}>+</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recording Duration</Label>
            <Select 
              value={req.recording_days?.toString() || "15"} 
              onValueChange={(val) => setReq((prev: any) => ({...prev, recording_days: parseInt(val || "0"), recording_mode: parseInt(val || "0") === 0 ? "live_only" : "continuous"}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Live Viewing Only (No Recording)</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="15">15 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Technology</Label>
            <Select 
              value={req.technology_preference === "WiFi" ? "Wireless" : (req.technology_preference || "IP")} 
              onValueChange={(val) => setReq((prev: any) => ({...prev, technology_preference: val}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tech" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IP">IP (Digital / Modern)</SelectItem>
                <SelectItem value="HD">HD (Analog / Cost Effective)</SelectItem>
                <SelectItem value="Wireless">Smart Wireless (Wi-Fi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {req.technology_preference === "Wireless" ? (
            <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Camera Power Point Availability
                </Label>
                <Select
                  value={req.power_wiring_option || "socket_available"}
                  onValueChange={(val: any) => {
                    const wirelessCams = req.camera_count || 1;
                    setReq(prev => ({
                      ...prev,
                      power_wiring_option: val,
                      total_power_cable_meters: val === "wire_needed" ? (prev.total_power_cable_meters || wirelessCams * 10) : 0,
                      power_cable_meters: val === "wire_needed" ? 10 : 0
                    }));
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900">
                    <SelectValue placeholder="Select power availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socket_available">Power Socket Nearby (Within 1.5m) - Included (₹0)</SelectItem>
                    <SelectItem value="wire_needed">Need 2-Core Electrical Power Cabling (@ ₹10/m)</SelectItem>
                    <SelectItem value="site_survey">Site Survey / Decide on Site Visit (Pay on Actuals)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {req.power_wiring_option === "wire_needed" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Total 2-Core Electrical Wire Length (Meters)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 bg-white dark:bg-zinc-900"
                      onClick={() => {
                        const current = req.total_power_cable_meters || ((req.camera_count || 1) * 10);
                        const next = Math.max(5, current - 5);
                        setReq(prev => ({ ...prev, total_power_cable_meters: next, power_cable_meters: Math.ceil(next / (prev.camera_count || 1)) }));
                      }}
                      disabled={(req.total_power_cable_meters || ((req.camera_count || 1) * 10)) <= 5}
                    >
                      -
                    </Button>
                    <Input 
                      type="number" 
                      min="5"
                      value={req.total_power_cable_meters ?? ((req.camera_count || 1) * 10)} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setReq(prev => ({ ...prev, total_power_cable_meters: val, power_cable_meters: Math.ceil(val / (prev.camera_count || 1)) }));
                      }}
                      className="w-24 text-center bg-white dark:bg-zinc-900 font-bold"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 bg-white dark:bg-zinc-900"
                      onClick={() => {
                        const current = req.total_power_cable_meters || ((req.camera_count || 1) * 10);
                        const next = current + 5;
                        setReq(prev => ({ ...prev, total_power_cable_meters: next, power_cable_meters: Math.ceil(next / (prev.camera_count || 1)) }));
                      }}
                    >
                      +
                    </Button>
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-medium ml-1">
                      @ ₹10/m = ₹{((req.total_power_cable_meters || ((req.camera_count || 1) * 10)) * 10).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Total Cable Length (Meters, all cameras combined)</Label>
              <Input 
                type="number" 
                value={req.total_cable_length_meters || (req.cable_length_meters ? req.cable_length_meters * (req.camera_count || 1) : "") || ""} 
                placeholder="Leave blank for auto-calculation"
                onChange={(e) => setReq(prev => ({...prev, total_cable_length_meters: parseInt(e.target.value) || undefined, cable_length_meters: undefined}))}
              />
              {req.total_cable_length_meters && req.total_cable_length_meters > ((req.camera_count || 1) * 15) && (
                <p className="text-xs text-red-500 font-medium mt-1">
                  Exceeds {((req.camera_count || 1) * 15)}m free limit. Excess incurs a labor surcharge of ₹15/m.
                </p>
              )}
            </div>
          )}

          
          {req.technology_preference !== "Wireless" && Number(req.wifi_camera_count) > 0 && (
            <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Power Availability for {req.wifi_camera_count} Smart Wi-Fi Cameras
                </Label>
                <Select
                  value={req.power_wiring_option || "socket_available"}
                  onValueChange={(val: any) => {
                    const wifiCams = Number(req.wifi_camera_count) || 1;
                    setReq(prev => ({
                      ...prev,
                      power_wiring_option: val,
                      total_power_cable_meters: val === "wire_needed" ? (prev.total_power_cable_meters || wifiCams * 10) : 0,
                      power_cable_meters: val === "wire_needed" ? 10 : 0
                    }));
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900">
                    <SelectValue placeholder="Select power availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socket_available">Power Socket Nearby (Within 1.5m) - Included (₹0)</SelectItem>
                    <SelectItem value="wire_needed">Need 2-Core Electrical Power Cabling (@ ₹10/m)</SelectItem>
                    <SelectItem value="site_survey">Site Survey / Decide on Site Visit (Pay on Actuals)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {req.power_wiring_option === "wire_needed" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Total 2-Core Electrical Wire Length (Meters)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 bg-white dark:bg-zinc-900"
                      onClick={() => {
                        const current = req.total_power_cable_meters || (Number(req.wifi_camera_count || 1) * 10);
                        const next = Math.max(5, current - 5);
                        setReq(prev => ({ ...prev, total_power_cable_meters: next, power_cable_meters: Math.ceil(next / Number(prev.wifi_camera_count || 1)) }));
                      }}
                      disabled={(req.total_power_cable_meters || (Number(req.wifi_camera_count || 1) * 10)) <= 5}
                    >
                      -
                    </Button>
                    <Input 
                      type="number" 
                      min="5"
                      value={req.total_power_cable_meters ?? (Number(req.wifi_camera_count || 1) * 10)} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setReq(prev => ({ ...prev, total_power_cable_meters: val, power_cable_meters: Math.ceil(val / Number(prev.wifi_camera_count || 1)) }));
                      }}
                      className="w-24 text-center bg-white dark:bg-zinc-900 font-bold"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 bg-white dark:bg-zinc-900"
                      onClick={() => {
                        const current = req.total_power_cable_meters || (Number(req.wifi_camera_count || 1) * 10);
                        const next = current + 5;
                        setReq(prev => ({ ...prev, total_power_cable_meters: next, power_cable_meters: Math.ceil(next / Number(prev.wifi_camera_count || 1)) }));
                      }}
                    >
                      +
                    </Button>
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-medium ml-1">
                      @ ₹10/m = ₹{((req.total_power_cable_meters || (Number(req.wifi_camera_count || 1) * 10)) * 10).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Site Internet / Wi-Fi Connection</Label>
            <Select 
              value={req.broadband_status || "yes"} 
              onValueChange={(val: any) => setReq(prev => ({...prev, broadband_status: val, wants_remote_viewing: val !== "no"}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Existing Wi-Fi / Broadband (Free)</SelectItem>
                <SelectItem value="wifi_extender">Have Wi-Fi, but Far Spots (Add Range Extender)</SelectItem>
                <SelectItem value="sim_router">No Wi-Fi at Site - Close Spots (Include 4G SIM Router)</SelectItem>
                <SelectItem value="independent_4g">No Wi-Fi at Site - Distant Spots (Independent 4G SIM per Camera)</SelectItem>
                <SelectItem value="no">Offline (Local Recording Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={handleSave} className="w-full" disabled={isUpdating}>
            {isUpdating ? "Updating Quote..." : "Update Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
