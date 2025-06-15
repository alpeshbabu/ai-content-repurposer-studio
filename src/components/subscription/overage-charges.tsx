'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Loader2, AlertTriangle } from 'lucide-react';

interface OverageCharge {
  id: string;
  amount: number;
  count: number;
  date: string;
  status: 'pending' | 'processed' | 'failed';
}

export function OverageCharges() {
  const [loading, setLoading] = useState(true);
  const [charges, setCharges] = useState<OverageCharge[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverageCharges() {
      try {
        setLoading(true);
        setError(null);
        // Wrap the fetch in a try/catch to handle network errors
        const response = await fetch('/api/subscription/overage', {
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000)
        }).catch(e => {
          console.error('Network error fetching overage charges:', e);
          throw new Error('Network error. Please try again.');
        });
        
        if (!response.ok) {
          // Get error message from response if possible
          let errorMessage = 'Failed to fetch overage charges';
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // If we can't parse JSON, use status text
            errorMessage = `Error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setCharges(data.charges || []);
      } catch (error) {
        console.error('Error fetching overage charges:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        // Set empty charges array so UI can handle no data state
        setCharges([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOverageCharges();
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">Loading overage charges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-red-50">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <h3 className="text-lg font-medium text-red-800">Unable to load overage charges</h3>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (charges.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="text-center">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No Overage Charges</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't incurred any overage charges yet.
          </p>
        </div>
      </div>
    );
  }

  // Calculate total pending charges
  const totalPending = charges
    .filter(charge => charge.status === 'pending')
    .reduce((sum, charge) => sum + charge.amount, 0);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-5 sm:px-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Overage Charges</h3>
          {totalPending > 0 && (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              ${totalPending.toFixed(2)} pending
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-white overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {charges.map((charge) => (
            <li key={charge.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {charge.count} content repurpose{charge.count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(charge.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${charge.status === 'processed' ? 'bg-green-100 text-green-800' : 
                      charge.status === 'failed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}
                  >
                    {charge.status}
                  </span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    ${charge.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t">
        <div className="text-sm">
          <p className="text-gray-500">
            Overage charges are billed at the end of your billing period. 
            Pending charges may still be adjusted based on your actual usage.
          </p>
        </div>
      </div>
    </div>
  );
} 