import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateQRCode } from '@/lib/utils/qrcode';
import { z } from 'zod';

// Validation schema for QR code generation
const qrCodeSchema = z.object({
  merchantId: z.string().uuid(),
  locationId: z.string().uuid(),
  action: z.enum(['purchase', 'return']).default('purchase'),
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request data
    const parsedData = qrCodeSchema.safeParse(data);
    
    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsedData.error.errors },
        { status: 400 }
      );
    }
    
    const { merchantId, locationId, action } = parsedData.data;
    
    // Check if location exists and belongs to merchant
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        merchantId,
      },
      include: {
        qrCode: true,
      },
    });
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found or does not belong to this merchant' },
        { status: 404 }
      );
    }
    
    // Generate QR code
    const qrCodeImage = await generateQRCode(merchantId, locationId, action);
    
    // Create or update QR code record in the database
    const uniqueCode = `${merchantId}-${locationId}-${Date.now()}`;
    
    if (location.qrCode) {
      // Update existing QR code
      await prisma.qRCode.update({
        where: { id: location.qrCode.id },
        data: {
          code: uniqueCode,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new QR code
      await prisma.qRCode.create({
        data: {
          code: uniqueCode,
          locationId,
          isActive: true,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      qrCode: qrCodeImage,
      code: uniqueCode,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    
    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }
    
    // Find QR code for location
    const qrCode = await prisma.qRCode.findUnique({
      where: { locationId },
      include: {
        location: {
          include: {
            merchant: true,
          },
        },
      },
    });
    
    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code not found for this location' },
        { status: 404 }
      );
    }
    
    // Generate QR code image
    const qrCodeImage = await generateQRCode(
      qrCode.location.merchantId,
      qrCode.locationId,
      'purchase'
    );
    
    return NextResponse.json({
      success: true,
      qrCode: qrCodeImage,
      code: qrCode.code,
      isActive: qrCode.isActive,
    });
  } catch (error) {
    console.error('Error retrieving QR code:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve QR code' },
      { status: 500 }
    );
  }
} 