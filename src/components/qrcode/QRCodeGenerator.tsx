'use client';

import { useState } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Validation schema
const qrCodeFormSchema = z.object({
  locationId: z.string().uuid({ message: 'Please select a location' }),
  action: z.enum(['purchase', 'return'], { 
    required_error: 'Please select an action type' 
  }),
});

type QRCodeFormValues = z.infer<typeof qrCodeFormSchema>;

interface Location {
  id: string;
  name: string;
}

interface QRCodeGeneratorProps {
  merchantId: string;
  locations: Location[];
}

export default function QRCodeGenerator({ merchantId, locations }: QRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<QRCodeFormValues>({
    resolver: zodResolver(qrCodeFormSchema),
    defaultValues: {
      action: 'purchase',
    },
  });
  
  const onSubmit = async (data: QRCodeFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId,
          locationId: data.locationId,
          action: data.action,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate QR code');
      }
      
      setQrCode(result.qrCode);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the QR code');
      setQrCode(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `receets-qr-code-${new Date().toISOString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Generate QR Code</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <select
            id="locationId"
            {...register('locationId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          {errors.locationId && (
            <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="action" className="block text-sm font-medium text-gray-700">
            QR Code Action
          </label>
          <select
            id="action"
            {...register('action')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="purchase">Purchase</option>
            <option value="return">Return</option>
          </select>
          {errors.action && (
            <p className="mt-1 text-sm text-red-600">{errors.action.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {qrCode && (
        <div className="mt-6 flex flex-col items-center">
          <div className="border-4 border-indigo-100 p-2 rounded-lg w-64 h-64 flex items-center justify-center bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="w-full h-full"
            />
          </div>
          
          <p className="mt-2 text-sm text-gray-500">
            Scan this QR code at the checkout counter
          </p>
          
          <button
            onClick={handleDownload}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
} 