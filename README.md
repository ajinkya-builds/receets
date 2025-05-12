# Receets - POS-Integrated Digital Receipts

Receets is a modern solution that provides POS-integrated checkout and returns processing for merchants, with real-time synchronization to a mobile app.

## Overview

This application streamlines the checkout and returns experience for both merchants and customers:

- **QR Code-Based System**: Customers scan store/location-specific QR codes to start the checkout or return process
- **Real-Time Synchronization**: All transactions are synced in real-time between the POS system and the Receets app
- **Flexible Returns**: Support for returns through physical scanning or digital selection via the Receets app
- **Multiple Payment Options**: Integrated with Receets Pay, Apple Pay, Google Pay, cash, and traditional card payments

## Features

- **Merchant Admin Portal**: Merchants can register, manage locations, generate QR codes, and configure business settings
- **POS Integration**: API-driven sale initiation/modification with real-time updates
- **Return Management**: Configurable return periods with support for negative quantities in sales orders
- **Customer Interaction**: Customers can review and modify their purchases in real-time

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js with Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **QR Code**: Generated and processed with the `qrcode` library

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/receets.git
cd receets
```

2. Install the dependencies:

```bash
npm install
# or
yarn install
```

3. Set up your environment variables:

```
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/receets"
JWT_SECRET="your-secret-key"
```

4. Run the database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
receets/
├── prisma/                     # Prisma schema and migrations
│   └── schema.prisma           # Database schema
├── public/                     # Static files
├── src/
│   ├── app/                    # Next.js App Router 
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (portal)/           # Merchant portal pages
│   │   ├── api/                # API endpoints
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   ├── forms/              # Form components
│   │   ├── merchant/           # Merchant-specific components
│   │   ├── pos/                # POS-related components
│   │   ├── qrcode/             # QR code components
│   │   └── ui/                 # UI components
│   ├── lib/                    # Utility functions and classes
│   │   ├── api/                # API client functions
│   │   ├── auth/               # Authentication utilities
│   │   ├── db/                 # Database utilities
│   │   ├── payment/            # Payment processing utilities
│   │   └── utils/              # General utilities
│   └── types/                  # TypeScript type definitions
└── package.json                # Project dependencies
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [QR Code Generator](https://www.npmjs.com/package/qrcode)
