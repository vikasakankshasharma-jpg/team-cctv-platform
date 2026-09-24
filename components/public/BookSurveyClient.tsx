"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin, User, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function BookSurveyClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    address: "",
    pincode: "",
    date: "",
    time_slot: "morning_10_1"
  });

  // Simple date generator for the next 7 available days (excluding Sundays)
  const getAvailableDates = () => {
    const dates = [];
    let d = new Date();
    d.setDate(d.getDate() + 1); // Start tomorrow
    
    while(dates.length < 5) {
      if (d.getDay() !== 0) { // 0 is Sunday
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error("Please select a date for the visit.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/book-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Visit Scheduled!</h3>
        <p className="text-gray-500 font-medium mb-8">
          Thank you, {formData.customer_name}. Your site survey is confirmed. We just sent you a WhatsApp confirmation with the details.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-zinc-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-black text-gray-900">Schedule Visit</h3>
        <p className="text-sm font-medium text-gray-500 mt-1">Pick a time that works best for you.</p>
      </div>

      <div className="space-y-4">
        {/* Date Selection */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" /> Select Date
          </label>
          <div className="grid grid-cols-5 gap-2">
            {availableDates.map((date, idx) => {
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = formData.date === dateStr;
              return (
                <div 
                  key={idx}
                  onClick={() => setFormData({...formData, date: dateStr})}
                  className={`border-2 rounded-xl p-2 text-center cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <div className={`text-xs font-bold uppercase ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-black ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time Slot
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'morning_10_1', label: '10 AM - 1 PM' },
              { id: 'afternoon_2_5', label: '2 PM - 5 PM' },
              { id: 'evening_5_7', label: '5 PM - 7 PM' },
            ].map(slot => (
              <div 
                key={slot.id}
                onClick={() => setFormData({...formData, time_slot: slot.id})}
                className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${formData.time_slot === slot.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-blue-200'}`}
              >
                <span className="text-xs font-bold">{slot.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1">
            <User className="w-3 h-3" /> Full Name
          </label>
          <input 
            required
            type="text" 
            value={formData.customer_name}
            onChange={e => setFormData({...formData, customer_name: e.target.value})}
            className="w-full text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1">
            <Phone className="w-3 h-3" /> Mobile Number
          </label>
          <input 
            required
            type="tel" 
            value={formData.customer_phone}
            onChange={e => setFormData({...formData, customer_phone: e.target.value})}
            className="w-full text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            placeholder="9999999999"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" /> Full Address
          </label>
          <input 
            required
            type="text" 
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            className="w-full text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            placeholder="House/Flat No, Street Name..."
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1">
            Pincode
          </label>
          <input 
            required
            type="text" 
            value={formData.pincode}
            onChange={e => setFormData({...formData, pincode: e.target.value})}
            className="w-full text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            placeholder="110001"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Site Survey"}
      </button>
    </form>
  );
}
