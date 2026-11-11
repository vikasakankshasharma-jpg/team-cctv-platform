"use client";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const [req, setReq] = useState<CCTVRequirement>(currentRequirement);

  const handleSave = () => {
    onUpdate(req);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("ecd_title")}</DialogTitle>
          <DialogDescription>
            {t("ecd_subtitle")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label>{t("ecd_cam_qty")}</Label>
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
            <Label>{t("ecd_rec_days")}</Label>
            <Select 
              value={req.recording_days?.toString() || "15"} 
              onValueChange={(val) => setReq((prev: any) => ({...prev, recording_days: parseInt(val || "0"), recording_mode: parseInt(val || "0") === 0 ? "live_only" : "continuous"}))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("ecd_sel_days")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("ecd_live_only")}</SelectItem>
                <SelectItem value="7">{t("ecd_days_n", "{n} Days", { n: "7" })}</SelectItem>
                <SelectItem value="15">{t("ecd_days_n", "{n} Days", { n: "15" })}</SelectItem>
                <SelectItem value="30">{t("ecd_days_n", "{n} Days", { n: "30" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("ecd_tech")}</Label>
            <Select 
              value={req.technology_preference === "WiFi" ? "Wireless" : (req.technology_preference || "IP")} 
              onValueChange={(val) => setReq((prev: any) => ({...prev, technology_preference: val}))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("ecd_sel_tech")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IP">{t("ecd_tech_ip")}</SelectItem>
                <SelectItem value="HD">{t("ecd_tech_hd")}</SelectItem>
                <SelectItem value="Wireless">{t("ecd_tech_wifi")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {req.technology_preference === "Wireless" ? (
            <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {t("iqr_cam_power_avail")}
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
                    <SelectValue placeholder={t("ecd_sel_power")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socket_available">{t("ecd_pwr_socket")}</SelectItem>
                    <SelectItem value="wire_needed">{t("ecd_pwr_wire")}</SelectItem>
                    <SelectItem value="site_survey">{t("ecd_pwr_survey")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {req.power_wiring_option === "wire_needed" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("ecd_wire_len")}
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
                      {t("ecd_per_m_total", "@ ₹10/m = ₹{amount}", { amount: ((req.total_power_cable_meters || ((req.camera_count || 1) * 10)) * 10).toLocaleString("en-IN") })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("ecd_cable_len")}</Label>
              <Input 
                type="number" 
                value={req.total_cable_length_meters || (req.cable_length_meters ? req.cable_length_meters * (req.camera_count || 1) : "") || ""} 
                placeholder={t("ecd_cable_ph")}
                onChange={(e) => setReq(prev => ({...prev, total_cable_length_meters: parseInt(e.target.value) || undefined, cable_length_meters: undefined}))}
              />
              {req.total_cable_length_meters && req.total_cable_length_meters > ((req.camera_count || 1) * 15) && (
                <p className="text-xs text-red-500 font-medium mt-1">
                  {t("ecd_cable_excess", "Exceeds {limit}m free limit. Excess incurs a labor surcharge of ₹15/m.", { limit: String((req.camera_count || 1) * 15) })}
                </p>
              )}
            </div>
          )}

          
          {req.technology_preference !== "Wireless" && Number(req.wifi_camera_count) > 0 && (
            <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  {t("ecd_wifi_pwr", "Power Availability for {count} Smart Wi-Fi Cameras", { count: String(Number(req.wifi_camera_count) || 0) })}
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
                    <SelectValue placeholder={t("ecd_sel_power")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socket_available">{t("ecd_pwr_socket")}</SelectItem>
                    <SelectItem value="wire_needed">{t("ecd_pwr_wire")}</SelectItem>
                    <SelectItem value="site_survey">{t("ecd_pwr_survey")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {req.power_wiring_option === "wire_needed" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("ecd_wire_len")}
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
                      {t("ecd_per_m_total", "@ ₹10/m = ₹{amount}", { amount: ((req.total_power_cable_meters || (Number(req.wifi_camera_count || 1) * 10)) * 10).toLocaleString("en-IN") })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("ecd_net_lbl")}</Label>
            <Select 
              value={req.broadband_status || "yes"} 
              onValueChange={(val: any) => setReq(prev => ({...prev, broadband_status: val, wants_remote_viewing: val !== "no"}))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("ecd_sel_net")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t("ecd_net_yes")}</SelectItem>
                <SelectItem value="wifi_extender">{t("ecd_net_ext")}</SelectItem>
                <SelectItem value="sim_router">{t("ecd_net_router")}</SelectItem>
                <SelectItem value="independent_4g">{t("ecd_net_4g")}</SelectItem>
                <SelectItem value="no">{t("ecd_net_offline")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={handleSave} className="w-full h-auto min-h-10 py-2.5 whitespace-normal text-center leading-snug" disabled={isUpdating}>
            {isUpdating ? t("ecd_updating") : t("ecd_update_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
