import React from "react";
import { requireSuperAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { AIPerformanceChart } from "@/components/admin/AIPerformanceChart";

// Server Component
export default async function AIDashboardPage() {
  // 1. Security enforcement
  await requireSuperAdmin();

  // 2. Fetch pending knowledge items and auto-corrected items from the Brain
  let dashboardItems: any[] = [];
  try {
    const snapshot = await adminDb.collection("ai_brain")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
      
    dashboardItems = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString()
      };
    });
  } catch (error) {
    console.error("Failed to fetch brain entries:", error);
  }

  // Filter for the table (pending review or auto-corrected or feedback given)
  const tableItems = dashboardItems.filter((item: any) => !item.approvedByAdmin || item.autoCorrected || item.userRating !== 0);

  return (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Knowledge Brain (Admin)</h1>
          <p className="text-gray-500 mt-2">Review pending answers, user feedback, and Night School auto-corrections.</p>
        </div>
      </div>

      <AIPerformanceChart dashboardItems={dashboardItems} />

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Question</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Master AI Answer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Feedback</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No pending knowledge items or recent feedback to review.
                </td>
              </tr>
            ) : (
              tableItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 w-1/4 align-top">
                    {item.question}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 w-1/2 align-top">
                    <div className="whitespace-pre-wrap">{item.answer}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 align-top space-y-2">
                    {item.autoCorrected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Auto-Corrected
                      </span>
                    )}
                    {!item.approvedByAdmin && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    )}
                    {item.userRating === 1 && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        👍 User Liked
                      </span>
                    )}
                    {item.userRating === -1 && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        👎 User Disliked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                    {!item.approvedByAdmin ? (
                      <>
                        <button className="text-blue-600 hover:text-blue-900 font-semibold mr-4">Edit</button>
                        <button className="text-green-600 hover:text-green-900 font-semibold">Approve</button>
                      </>
                    ) : (
                        <button className="text-gray-400 hover:text-red-900 font-semibold">Delete</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
