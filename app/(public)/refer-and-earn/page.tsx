import React from "react";
import ReferAndEarnClient from "./ReferAndEarnClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn ₹500 | TEAM CCTV",
  description: "Share your referral code with friends and family. They get ₹500 discount, you earn ₹500 cash per installation.",
};

export default function ReferAndEarnPage() {
  return <ReferAndEarnClient />;
}
