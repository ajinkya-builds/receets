import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for line items
const lineItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().int(),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number(),
});

// Validation schema for sales
const saleSchema = z.object({
  merchantId: z.string().uuid(),
  locationId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  customerCode: z.string().optional(), // Alternative to customerId
  saleType: z.enum(['PURCHASE', 'RETURN', 'EXCHANGE']).default('PURCHASE'),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED']).default('DRAFT'),
  totalAmount: z.number(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  finalAmount: z.number(),
  promoCode: z.string().optional(),
  paymentMethod: z.enum(['RECEETS_PAY', 'APPLE_PAY', 'GOOGLE_PAY', 'CASH', 'CARD', 'NO_PAYMENT']).optional(),
  referenceId: z.string().optional(),
  parentSaleId: z.string().uuid().optional(),
  lineItems: z.array(lineItemSchema),
});

// API endpoint to create a new sale
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request data
    const parsedData = saleSchema.safeParse(data);
    
    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsedData.error.errors },
        { status: 400 }
      );
    }
    
    const saleData = parsedData.data;
    
    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: saleData.merchantId },
    });
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }
    
    // Check if location exists and belongs to merchant
    const location = await prisma.location.findFirst({
      where: {
        id: saleData.locationId,
        merchantId: saleData.merchantId,
      },
    });
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found or does not belong to this merchant' },
        { status: 404 }
      );
    }
    
    // Handle customer lookup by code if customerId is not provided
    let customerId = saleData.customerId;
    
    if (!customerId && saleData.customerCode) {
      const customer = await prisma.customer.findFirst({
        where: {
          customerCode: saleData.customerCode,
          merchantId: saleData.merchantId,
        },
      });
      
      if (customer) {
        customerId = customer.id;
      }
    }
    
    // Check if parent sale exists for returns/exchanges
    if (saleData.parentSaleId) {
      const parentSale = await prisma.sale.findFirst({
        where: {
          id: saleData.parentSaleId,
          merchantId: saleData.merchantId,
        },
      });
      
      if (!parentSale) {
        return NextResponse.json(
          { error: 'Parent sale not found or does not belong to this merchant' },
          { status: 404 }
        );
      }
    }
    
    // Create the sale
    const sale = await prisma.sale.create({
      data: {
        merchantId: saleData.merchantId,
        locationId: saleData.locationId,
        customerId,
        saleType: saleData.saleType,
        status: saleData.status,
        totalAmount: saleData.totalAmount,
        discountAmount: saleData.discountAmount,
        taxAmount: saleData.taxAmount,
        finalAmount: saleData.finalAmount,
        promoCode: saleData.promoCode,
        paymentMethod: saleData.paymentMethod,
        referenceId: saleData.referenceId,
        parentSaleId: saleData.parentSaleId,
        lineItems: {
          create: saleData.lineItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      sale,
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

// API endpoint to get sales for a customer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const customerCode = searchParams.get('customerCode');
    const merchantId = searchParams.get('merchantId');
    const daysAgo = searchParams.get('daysAgo') ? parseInt(searchParams.get('daysAgo')!) : 7;
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }
    
    if (!customerId && !customerCode) {
      return NextResponse.json(
        { error: 'Either Customer ID or Customer Code is required' },
        { status: 400 }
      );
    }
    
    // Get customer by code if ID is not provided
    let actualCustomerId = customerId;
    
    if (!actualCustomerId && customerCode) {
      const customer = await prisma.customer.findFirst({
        where: {
          customerCode,
          merchantId,
        },
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      actualCustomerId = customer.id;
    }
    
    // Calculate date range for return eligibility
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysAgo);
    
    // Get recent sales for the customer
    const sales = await prisma.sale.findMany({
      where: {
        merchantId,
        customerId: actualCustomerId as string,
        createdAt: {
          gte: dateLimit,
        },
        status: 'COMPLETED',
      },
      include: {
        lineItems: true,
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error('Error retrieving sales:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sales' },
      { status: 500 }
    );
  }
}

// API endpoint to update a sale
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const saleId = data.saleId;
    
    if (!saleId) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }
    
    // Find the sale
    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { lineItems: true },
    });
    
    if (!existingSale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data (excluding id and any fields that shouldn't be updated)
    const { saleId: _, lineItems, ...updateData } = data;
    
    // Update sale
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: updateData,
    });
    
    // Handle line items if provided
    if (lineItems && Array.isArray(lineItems)) {
      // Delete all existing line items
      await prisma.lineItem.deleteMany({
        where: { saleId },
      });
      
      // Create new line items
      await prisma.lineItem.createMany({
        data: lineItems.map(item => ({
          saleId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          discountAmount: item.discountAmount ?? 0,
          totalAmount: item.totalAmount,
        })),
      });
    }
    
    // Get updated sale with line items
    const finalSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { lineItems: true },
    });
    
    return NextResponse.json({
      success: true,
      sale: finalSale,
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    );
  }
} 