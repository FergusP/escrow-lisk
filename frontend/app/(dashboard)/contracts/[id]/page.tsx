"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  FileText, 
  Globe, 
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Download,
  Eye
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Mock data - will be replaced with Ponder query
const mockContract = {
  id: 'CTR-2024-001',
  buyer: {
    address: '0x123...abc',
    email: 'buyer@company.com',
    company: 'ABC Trading Ltd',
    country: 'United States'
  },
  seller: {
    address: '0x456...def',
    email: 'seller@export.com', 
    company: 'XYZ Exports',
    country: 'China'
  },
  amount: 50000,
  currency: 'USDC',
  status: 'DOCUMENTS_PENDING', // CREATED, FUNDED, DOCUMENTS_PENDING, SETTLED
  createdAt: '2024-01-15T10:00:00Z',
  fundedAt: '2024-01-15T14:30:00Z',
  deliveryDeadline: '2024-02-15T00:00:00Z',
  description: 'High-quality electronic components for manufacturing',
  items: [
    { description: 'Microprocessors', quantity: 1000, unitPrice: 45, total: 45000 },
    { description: 'Capacitors', quantity: 5000, unitPrice: 1, total: 5000 }
  ],
  documents: [
    { 
      type: 'bill_of_lading', 
      name: 'Bill of Lading - Shipment #12345',
      uploadedAt: '2024-01-18T09:00:00Z',
      hash: '0xabc123...',
      url: '/documents/bol-12345.pdf'
    },
    { 
      type: 'certificate_of_origin', 
      name: 'Certificate of Origin',
      uploadedAt: '2024-01-18T09:15:00Z',
      hash: '0xdef456...',
      url: '/documents/coo-12345.pdf'
    },
    { 
      type: 'packing_list', 
      name: 'Packing List',
      uploadedAt: '2024-01-18T09:30:00Z',
      hash: '0x789ghi...',
      url: '/documents/pl-12345.pdf'
    }
  ],
  timeline: [
    { event: 'Contract Created', date: '2024-01-15T10:00:00Z', actor: 'buyer' },
    { event: 'Contract Funded', date: '2024-01-15T14:30:00Z', actor: 'buyer' },
    { event: 'Documents Uploaded', date: '2024-01-18T09:30:00Z', actor: 'seller' },
  ]
};

// Mock current user - will be from wagmi
const currentUser = {
  address: '0x123...abc',
  role: 'buyer' // determined by comparing address with contract buyer/seller
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine user role in this contract
  const isBuyer = currentUser.address === mockContract.buyer.address;
  const isSeller = currentUser.address === mockContract.seller.address;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-gray-100 text-gray-800';
      case 'FUNDED': return 'bg-purple-100 text-purple-800';
      case 'DOCUMENTS_PENDING': return 'bg-orange-100 text-orange-800';
      case 'SETTLED': return 'bg-green-100 text-green-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CREATED': return <Clock className="h-4 w-4" />;
      case 'FUNDED': return <DollarSign className="h-4 w-4" />;
      case 'DOCUMENTS_PENDING': return <FileText className="h-4 w-4" />;
      case 'SETTLED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleReleaseFunds = async () => {
    setIsProcessing(true);
    try {
      // Will call confirmDelivery() on smart contract
      console.log('Releasing funds...');
      alert('Funds released successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error releasing funds:', error);
      alert('Failed to release funds');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDocuments = async () => {
    setIsProcessing(true);
    try {
      // Will call initiateDispute() on smart contract
      const reason = prompt('Please provide a reason for rejecting the documents:');
      if (reason) {
        console.log('Initiating dispute:', reason);
        alert('Documents rejected. Dispute initiated.');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error rejecting documents:', error);
      alert('Failed to reject documents');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contracts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Contract {params.id}</h1>
            <p className="text-gray-600">View contract details and take actions</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(mockContract.status)} px-3 py-1`}>
          {getStatusIcon(mockContract.status)}
          <span className="ml-2">{mockContract.status.replace('_', ' ')}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Buyer</p>
                  <div className="space-y-1">
                    <p className="font-semibold">{mockContract.buyer.company}</p>
                    <p className="text-sm text-gray-600">{mockContract.buyer.email}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="h-3 w-3" />
                      <span>{mockContract.buyer.country}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{mockContract.buyer.address}</p>
                  </div>
                  {isBuyer && (
                    <Badge variant="outline" className="mt-2">You</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Seller</p>
                  <div className="space-y-1">
                    <p className="font-semibold">{mockContract.seller.company}</p>
                    <p className="text-sm text-gray-600">{mockContract.seller.email}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="h-3 w-3" />
                      <span>{mockContract.seller.country}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{mockContract.seller.address}</p>
                  </div>
                  {isSeller && (
                    <Badge variant="outline" className="mt-2">You</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="mt-1">{mockContract.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Items</p>
                <div className="space-y-2">
                  {mockContract.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-600">{item.quantity} units × ${item.unitPrice}</p>
                      </div>
                      <p className="font-semibold">${item.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="font-semibold">Total Amount</p>
                  <p className="text-xl font-bold">${mockContract.amount.toLocaleString()} {mockContract.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {mockContract.documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {mockContract.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">
                            Uploaded {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">Hash: {doc.hash}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Actions for DOCUMENTS_PENDING */}
          {isBuyer && mockContract.status === 'DOCUMENTS_PENDING' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  The seller has uploaded shipping documents. Please review them and take action:
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleReleaseFunds}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Funds to Seller
                  </Button>
                  <Button 
                    onClick={handleRejectDocuments}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Documents
                  </Button>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  Releasing funds will complete the transaction. Rejecting will initiate a dispute.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockContract.timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      {index < mockContract.timeline.length - 1 && (
                        <div className="h-12 w-0.5 bg-gray-200 ml-0.5 mt-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.event}</p>
                      <p className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Contract ID</p>
                <p className="font-mono text-sm">{mockContract.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm">{new Date(mockContract.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Deadline</p>
                <p className="text-sm">{new Date(mockContract.deliveryDeadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Currency</p>
                <p className="text-sm">{mockContract.currency}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}