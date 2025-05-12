'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface LineItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  totalAmount: number;
}

interface Sale {
  id: string;
  createdAt: string;
  finalAmount: number;
  saleType: 'PURCHASE' | 'RETURN' | 'EXCHANGE';
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  lineItems: LineItem[];
  location: {
    name: string;
  };
}

interface CustomerSalesListProps {
  merchantId: string;
  onSelectSale: (sale: Sale) => void;
}

export default function CustomerSalesList({ merchantId, onSelectSale }: CustomerSalesListProps) {
  const [customerCode, setCustomerCode] = useState('');
  const [daysAgo, setDaysAgo] = useState(7);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  
  const fetchSales = async () => {
    if (!customerCode) {
      setError('Please enter a customer code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/pos/sales?merchantId=${merchantId}&customerCode=${customerCode}&daysAgo=${daysAgo}`
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch sales');
      }
      
      setSales(result.sales || []);
      
      if (result.sales.length === 0) {
        setError('No eligible sales found for this customer');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching sales');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectSale = (sale: Sale) => {
    setSelectedSaleId(sale.id);
    onSelectSale(sale);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Find Customer Sales</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700">
            Customer Code
          </label>
          <input
            type="text"
            id="customerCode"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter customer code"
          />
        </div>
        
        <div>
          <label htmlFor="daysAgo" className="block text-sm font-medium text-gray-700">
            Return Period (Days)
          </label>
          <input
            type="number"
            id="daysAgo"
            value={daysAgo}
            onChange={(e) => setDaysAgo(parseInt(e.target.value) || 7)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min="1"
            max="365"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={fetchSales}
            disabled={isLoading || !customerCode}
            className="w-full h-10 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Find Sales'}
          </button>
        </div>
      </div>
      
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
      
      {sales.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Eligible Sales for Return</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    className={`${selectedSaleId === sale.id ? 'bg-indigo-50' : ''} hover:bg-gray-50`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.location.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${sale.finalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.lineItems.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSelectSale(sale)}
                        className={`text-indigo-600 hover:text-indigo-900 ${
                          selectedSaleId === sale.id ? 'font-bold' : ''
                        }`}
                      >
                        {selectedSaleId === sale.id ? 'Selected' : 'Select for Return'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedSaleId && sales.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Sale Details</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.find(s => s.id === selectedSaleId)?.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 