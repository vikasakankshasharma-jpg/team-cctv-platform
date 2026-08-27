"use client";

import React from "react";
import { PricingResult, CCTVRequirement } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuoteComparisonProps {
  plans: {
    budget: PricingResult;
    recommended: PricingResult;
    premium: PricingResult;
  };
  requirement: CCTVRequirement;
  onSelectPlan: (planType: "budget" | "recommended" | "premium") => void;
  onEditConfiguration: () => void;
}

export function QuoteComparison({ plans, requirement, onSelectPlan, onEditConfiguration }: QuoteComparisonProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">Your CCTV Requirement</h3>
          <p className="text-sm text-blue-700">
            {requirement.camera_count} Cameras • {requirement.technology_preference} • {requirement.recording_days > 0 ? `${requirement.recording_days} Days Recording` : 'Live Only'} • {requirement.wants_remote_viewing ? 'Mobile Viewing' : 'No Mobile Viewing'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEditConfiguration}>
          Edit Requirement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-center text-gray-500 uppercase text-sm tracking-wider">Lowest</CardTitle>
            <div className="text-center text-3xl font-bold mt-2">{formatPrice(plans.budget.total_payable)}</div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span>Cameras</span> <span className="font-medium">{requirement.camera_count}</span></li>
              <li className="flex justify-between"><span>Resolution</span> <span className="font-medium">2MP (Basic)</span></li>
              <li className="flex justify-between"><span>Recording</span> <span className="font-medium">{requirement.recording_days} Days</span></li>
              <li className="flex justify-between"><span>Installation</span> <span className="font-medium">Included</span></li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => onSelectPlan("budget")}>View Details</Button>
          </CardFooter>
        </Card>

        {/* Recommended Plan */}
        <Card className="flex flex-col border-primary shadow-lg relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-primary text-primary-foreground px-3 py-1 uppercase tracking-wide">⭐ Recommended</Badge>
          </div>
          <CardHeader className="pt-8">
            <div className="text-center text-4xl font-bold text-primary">{formatPrice(plans.recommended.total_payable)}</div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span>Cameras</span> <span className="font-medium">{requirement.camera_count}</span></li>
              <li className="flex justify-between"><span>Resolution</span> <span className="font-medium text-primary font-bold">5MP (Clearer)</span></li>
              <li className="flex justify-between"><span>Recording</span> <span className="font-medium">{requirement.recording_days} Days</span></li>
              <li className="flex justify-between"><span>Installation</span> <span className="font-medium">Included</span></li>
            </ul>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md border text-xs text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">Why we recommend this:</p>
              <ul className="list-disc pl-4 space-y-1">
                {plans.recommended.recommendation_reasons?.length ? (
                  plans.recommended.recommendation_reasons.map((reason: string, idx: number) => (
                    <li key={idx}>{reason}</li>
                  ))
                ) : (
                  <li>Best balance of price and long-term reliability for your requirements.</li>
                )}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => onSelectPlan("recommended")}>Select Plan</Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-center text-gray-500 uppercase text-sm tracking-wider">Premium</CardTitle>
            <div className="text-center text-3xl font-bold mt-2">{formatPrice(plans.premium.total_payable)}</div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span>Cameras</span> <span className="font-medium">{requirement.camera_count}</span></li>
              <li className="flex justify-between"><span>Resolution</span> <span className="font-medium">8MP (Maximum Detail)</span></li>
              <li className="flex justify-between"><span>Recording</span> <span className="font-medium">{requirement.recording_days} Days</span></li>
              <li className="flex justify-between"><span>Installation</span> <span className="font-medium">Included</span></li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => onSelectPlan("premium")}>View Details</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

