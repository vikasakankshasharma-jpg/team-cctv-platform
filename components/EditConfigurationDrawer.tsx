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
              value={req.technology_preference || "IP"} 
              onValueChange={(val) => setReq((prev: any) => ({...prev, technology_preference: val}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tech" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IP">IP (Digital / Modern)</SelectItem>
                <SelectItem value="HD">HD (Analog / Cost Effective)</SelectItem>
                <SelectItem value="WiFi">WiFi (Wireless)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
