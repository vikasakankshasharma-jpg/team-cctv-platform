"use client";

import { useState } from "react";
import { User, Mail, Phone, Loader2, Save, MapPin } from "lucide-react";
import { updateCustomerProfile } from "@/app/actions/customer";
import { toast } from "sonner";

import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomerProfileClientProps {
  user: {
    uid: string;
    mobile?: string;
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
  };
}

export function CustomerProfileClient({ user }: CustomerProfileClientProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [addressData, setAddressData] = useState({
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    pincode: user.pincode || "",
    lat: user.lat || 0,
    lng: user.lng || 0
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("prof_err_name", "Name is required"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateCustomerProfile({ name, email, ...addressData });
      if (res.success) {
        toast.success(t("prof_ok_save", "Profile updated successfully!"));
      } else {
        toast.error(res.error || t("prof_err_fail", "Failed to update profile"));
      }
    } catch (e) {
      toast.error(t("prof_err_gen", "An error occurred while saving"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm max-w-2xl mx-auto mt-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600 shrink-0" />
          {t("prof_title", "My Profile")}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
          {t("prof_desc", "Update your personal information. This will automatically update your details across all active quotations and bookings.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{t("prof_phone", "Phone Number")}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={user.mobile ? `+91 ${user.mobile}` : t("prof_not_prov", "Not provided")}
              disabled
              className="block w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 font-semibold cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2">{t("prof_phone_note", "Phone number cannot be changed as it is used for login.")}</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{t("prof_full_name", "Full Name")}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("prof_name_ph", "e.g. Rahul Sharma")}
              className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{t("prof_email", "Email Address (Optional)")}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("prof_email_ph", "e.g. rahul@example.com")}
              className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{t("prof_addr", "Default Billing/Installation Address")}</label>
          <PlacesAutocomplete 
            defaultValue={addressData.address}
            placeholder={t("prof_addr_ph", "Search for your building, street, or area...")}
            onPlaceSelected={(place) => setAddressData({
              address: place.full_address,
              city: place.city,
              state: place.state,
              pincode: place.pincode,
              lat: place.lat,
              lng: place.lng
            })}
          />
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 whitespace-normal text-center leading-snug"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />}
            {isSaving ? t("prof_saving", "Saving...") : t("prof_save", "Save Changes")}
          </button>
        </div>
      </form>
    </div>
  );
}
