import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snap = await adminDb.collection('products').get();
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const addonsSnap = await adminDb.collection('addons').get();
  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ products, addons });
}
