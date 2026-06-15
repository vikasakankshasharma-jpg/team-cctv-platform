const fs = require('fs');
const path = require('path');

function serializeDoc(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeDoc(item));
  }

  // Handle Objects
  if (typeof data === "object") {
    const obj = data;

    // 1. Handle Firestore Timestamp (check for toDate or _seconds)
    if (typeof obj.toDate === "function") {
      return obj.toDate().toISOString();
    }
    
    if (obj._seconds !== undefined) {
      // It's a raw timestamp from admin SDK
      return new Date(obj._seconds * 1000).toISOString();
    }

    // 2. Handle standard objects (deep serialize)
    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDoc(value);
    }
    return serialized;
  }

  return data;
}

const mockData = {
    id: "mock-quote",
    leadId: "mock-lead",
    quoteNumber: "MOCK-1234",
    status: "pending",
    issuedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    customer: {
        name: "Test User",
        phone: "9999999999",
        email: "test@example.com",
    },
    installationAddress: "Mock Address, India - 110001",
    propertyType: "Residential",
    propertyDetail: "",
    siteVisitDate: "",
    lineItems: [
        { id: "cam", name: "2MP Smart Camera", description: "Standard IP Camera", quantity: 4, unitPrice: 2800 },
        { id: "nvr", name: "4-Ch NVR", description: "Smart IP Recorder", quantity: 1, unitPrice: 4500 },
        { id: "hdd", name: "1TB HDD", description: "Surveillance Storage", quantity: 1, unitPrice: 3200 },
        { id: "install", name: "Installation", description: "Pro Setup", quantity: 4, unitPrice: 1000 },
    ],
    gstPercent: 18,
    advancePercent: 30,
    companyGstin: "08AABCT1234A1ZS",
    notes: "Mock quotation for testing.",
};

console.log("Starting serialization...");
const result = serializeDoc(mockData);
console.log("Finished serialization.");
