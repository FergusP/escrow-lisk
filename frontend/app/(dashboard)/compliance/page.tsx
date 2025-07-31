"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Eye,
  Package,
  Truck
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'rejected';
  uploadedAt: string;
  size: string;
  contractId?: string;
}

interface Contract {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  status: 'FUNDED' | 'DOCUMENTS_PENDING';
  requiredDocs: string[];
  uploadedDocs: string[];
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Certificate of Origin - Widgets A',
    type: 'certificate_of_origin',
    status: 'verified',
    uploadedAt: '2024-01-15T10:00:00Z',
    size: '2.4 MB',
    contractId: 'CTR-2024-001'
  },
  {
    id: '2',
    name: 'Bill of Lading - ABC Trading',
    type: 'bill_of_lading',
    status: 'pending',
    uploadedAt: '2024-01-14T14:30:00Z',
    size: '1.8 MB',
    contractId: 'CTR-2024-002'
  },
  {
    id: '3',
    name: 'Inspection Report - Quality Check',
    type: 'inspection_report',
    status: 'verified',
    uploadedAt: '2024-01-12T09:15:00Z',
    size: '3.1 MB'
  },
  {
    id: '4',
    name: 'Insurance Certificate',
    type: 'insurance',
    status: 'rejected',
    uploadedAt: '2024-01-10T16:45:00Z',
    size: '1.2 MB'
  }
];

const mockContractsNeedingDocs: Contract[] = [
  {
    id: 'CTR-2024-003',
    buyer: 'ABC Trading Co.',
    seller: 'Your Company',
    amount: 45000,
    status: 'FUNDED',
    requiredDocs: ['bill_of_lading', 'certificate_of_origin', 'packing_list'],
    uploadedDocs: []
  },
  {
    id: 'CTR-2024-004',
    buyer: 'XYZ Imports',
    seller: 'Your Company',
    amount: 32000,
    status: 'DOCUMENTS_PENDING',
    requiredDocs: ['bill_of_lading', 'certificate_of_origin', 'inspection_report'],
    uploadedDocs: ['certificate_of_origin']
  }
];

export default function CompliancePage() {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'certificate_of_origin': 'Certificate of Origin',
      'bill_of_lading': 'Bill of Lading',
      'inspection_report': 'Inspection Report',
      'insurance': 'Insurance Certificate',
      'packing_list': 'Packing List',
      'customs_declaration': 'Customs Declaration'
    };
    return types[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Documents</h1>
          <p className="text-gray-600">Manage trade documents and compliance requirements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card className="gradient-card-blue hover-lift">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-blue-500">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-blue-900">18</div>
            <div className="stats-label text-blue-700">Total Documents</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-green hover-lift">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-green-500">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-green-900">12</div>
            <div className="stats-label text-green-700">Verified</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-orange hover-lift">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-orange-500">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-orange-900">4</div>
            <div className="stats-label text-orange-700">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-red hover-lift">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-red-500">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-red-900">2</div>
            <div className="stats-label text-red-700">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Needing Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts Awaiting Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {mockContractsNeedingDocs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No contracts require documents at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockContractsNeedingDocs.map((contract) => (
                <div key={contract.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{contract.id}</h3>
                        <Badge className={contract.status === 'FUNDED' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}>
                          <Truck className="h-3 w-3 mr-1" />
                          {contract.status === 'FUNDED' ? 'Ready to Ship' : 'Awaiting Documents'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Buyer: {contract.buyer} | Amount: ${contract.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Required Documents Section */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Required Documents:</p>
                    
                    {/* Documents Upload Area */}
                    <div className="space-y-2">
                      {contract.requiredDocs.map((docType) => {
                        const isUploaded = contract.uploadedDocs.includes(docType);
                        const fileKey = `${contract.id}-${docType}`;
                        const hasSelectedFile = uploadedFiles[fileKey] !== undefined;
                        
                        return (
                          <div key={docType} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {isUploaded ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : hasSelectedFile ? (
                                  <FileText className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm font-medium">{getDocumentTypeLabel(docType)}</span>
                              </div>
                              {hasSelectedFile && uploadedFiles[fileKey] && (
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                  Selected: {uploadedFiles[fileKey]!.name}
                                </p>
                              )}
                            </div>
                            
                            {!isUploaded && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  id={fileKey}
                                  className="hidden"
                                  accept=".pdf,.png,.jpg,.doc,.docx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUploadedFiles(prev => ({ ...prev, [fileKey]: file }));
                                    }
                                  }}
                                />
                                <label htmlFor={fileKey}>
                                  <Button size="sm" variant="outline" asChild>
                                    <span className="cursor-pointer">
                                      <Upload className="h-3 w-3 mr-1" />
                                      Choose File
                                    </span>
                                  </Button>
                                </label>
                                {hasSelectedFile && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setUploadedFiles(prev => {
                                        const newFiles = { ...prev };
                                        delete newFiles[fileKey];
                                        return newFiles;
                                      });
                                    }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {isUploaded && (
                              <Badge className="bg-green-100 text-green-800">
                                Verified
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Submit to Blockchain Button */}
                    {contract.requiredDocs.filter(doc => !contract.uploadedDocs.includes(doc)).length > 0 && (
                      <div className="mt-4">
                        <Button 
                          className="w-full"
                          disabled={
                            contract.requiredDocs.filter(doc => !contract.uploadedDocs.includes(doc))
                              .some(doc => !uploadedFiles[`${contract.id}-${doc}`])
                          }
                          onClick={() => {
                            // This will:
                            // 1. Upload files to backend storage
                            // 2. Get document hashes
                            // 3. Call smart contract storeDocumentHash() for each document
                            // 4. Update contract status to DOCUMENTS_PENDING
                            console.log('Submitting documents to blockchain:', uploadedFiles);
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Submit Documents to Blockchain
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Documents will be verified on-chain and visible to buyer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search documents..." className="pl-10" />
              </div>
            </div>
            <Select defaultValue="all-types">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Document Types</SelectItem>
                <SelectItem value="certificate_of_origin">Certificate of Origin</SelectItem>
                <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                <SelectItem value="inspection_report">Inspection Report</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Documents */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="by-contract">By Contract</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Your Documents</CardTitle>
            </CardHeader>
            <CardContent>
          <div className="space-y-4">
            {mockDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.name}</p>
                      <Badge className={getStatusColor(doc.status)}>
                        {getStatusIcon(doc.status)}
                        <span className="ml-1">{doc.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getDocumentTypeLabel(doc.type)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      <span>{doc.size}</span>
                      {doc.contractId && (
                        <span className="text-blue-600">Contract: {doc.contractId}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="by-contract">
          <Card>
            <CardHeader>
              <CardTitle>Documents by Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['CTR-2024-001', 'CTR-2024-002'].map((contractId) => (
                  <div key={contractId} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{contractId}</h4>
                    <div className="space-y-2">
                      {mockDocuments.filter(doc => doc.contractId === contractId).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{getDocumentTypeLabel(doc.type)}</span>
                            <Badge className={`${getStatusColor(doc.status)} text-xs`}>
                              {doc.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}