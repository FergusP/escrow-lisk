"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator,
  Download, 
  FileText, 
  DollarSign,
  Percent,
  Building,
  Globe,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface TaxRecord {
  id: string;
  country: string;
  taxType: string;
  rate: number;
  amount: number;
  currency: string;
  period: string;
  status: 'calculated' | 'paid' | 'pending' | 'overdue';
  invoiceId?: string;
  contractId?: string;
  dueDate: string;
}

const mockTaxRecords: TaxRecord[] = [
  {
    id: '1',
    country: 'United States',
    taxType: 'Import Duty',
    rate: 12.5,
    amount: 1250,
    currency: 'USD',
    period: 'Q1 2024',
    status: 'paid',
    invoiceId: 'INV-2024-001',
    contractId: 'CTR-2024-001',
    dueDate: '2024-01-31'
  },
  {
    id: '2',
    country: 'European Union',
    taxType: 'VAT',
    rate: 21.0,
    amount: 2100,
    currency: 'EUR',
    period: 'Q1 2024',
    status: 'pending',
    invoiceId: 'INV-2024-002',
    contractId: 'CTR-2024-002',
    dueDate: '2024-02-15'
  },
  {
    id: '3',
    country: 'Singapore',
    taxType: 'GST',
    rate: 9.0,
    amount: 540,
    currency: 'SGD',
    period: 'Q1 2024',
    status: 'calculated',
    invoiceId: 'INV-2024-003',
    contractId: 'CTR-2024-003',
    dueDate: '2024-02-28'
  },
  {
    id: '4',
    country: 'United Kingdom',
    taxType: 'Customs Duty',
    rate: 8.5,
    amount: 425,
    currency: 'GBP',
    period: 'Q1 2024',
    status: 'overdue',
    invoiceId: 'INV-2024-004',
    contractId: 'CTR-2024-004',
    dueDate: '2024-01-15'
  }
];

const taxRates = [
  { country: 'United States', duties: 12.5, vat: 0, gst: 0 },
  { country: 'European Union', duties: 10.0, vat: 21.0, gst: 0 },
  { country: 'United Kingdom', duties: 8.5, vat: 20.0, gst: 0 },
  { country: 'Singapore', duties: 0, vat: 0, gst: 9.0 },
  { country: 'Canada', duties: 6.5, vat: 13.0, gst: 0 },
  { country: 'Australia', duties: 5.0, vat: 0, gst: 10.0 }
];

export default function TaxesPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'calculated': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'pending': return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'calculated': return <Calculator className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const totalTaxes = mockTaxRecords.reduce((sum, record) => sum + record.amount, 0);
  const paidTaxes = mockTaxRecords.filter(r => r.status === 'paid').reduce((sum, record) => sum + record.amount, 0);
  const pendingTaxes = mockTaxRecords.filter(r => r.status === 'pending' || r.status === 'calculated').reduce((sum, record) => sum + record.amount, 0);
  const overdueTaxes = mockTaxRecords.filter(r => r.status === 'overdue').reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Management</h1>
          <p className="text-gray-600">Track and manage international trade taxes and duties</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Taxes
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card className="gradient-card-blue hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-blue-500">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-blue-900">${totalTaxes.toLocaleString()}</div>
            <div className="stats-label text-blue-700">Total Taxes</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-green hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-green-500">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-green-900">${paidTaxes.toLocaleString()}</div>
            <div className="stats-label text-green-700">Paid</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-orange hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-orange-500">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-orange-900">${pendingTaxes.toLocaleString()}</div>
            <div className="stats-label text-orange-700">Pending</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-red hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-red-500">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-red-900">${overdueTaxes.toLocaleString()}</div>
            <div className="stats-label text-red-700">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {taxRates.map((rate) => (
                    <SelectItem key={rate.country} value={rate.country}>
                      {rate.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Value (USD)</label>
              <Input type="number" placeholder="10,000" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Current Tax Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taxRates.map((rate) => (
              <div key={rate.country} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">{rate.country}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Import Duties:</span>
                    <span className="font-medium">{rate.duties}%</span>
                  </div>
                  {rate.vat > 0 && (
                    <div className="flex justify-between">
                      <span>VAT:</span>
                      <span className="font-medium">{rate.vat}%</span>
                    </div>
                  )}
                  {rate.gst > 0 && (
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span className="font-medium">{rate.gst}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Records */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTaxRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Percent className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{record.taxType}</p>
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusIcon(record.status)}
                        <span className="ml-1">{record.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{record.country}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Rate: {record.rate}%</span>
                      <span>Period: {record.period}</span>
                      <span>Due: {new Date(record.dueDate).toLocaleDateString()}</span>
                      {record.contractId && (
                        <span className="text-blue-600">Contract: {record.contractId}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {record.amount.toLocaleString()} {record.currency}
                    </div>
                    <p className="text-sm text-gray-500">
                      {record.rate}% tax
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {mockTaxRecords.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Calculator className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tax records yet</h3>
              <p className="text-gray-600 mb-4">Start a trade to automatically calculate taxes and duties</p>
              <Button>Calculate First Tax</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Compliance Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">Tax Compliance Notice</h4>
              <p className="text-sm text-amber-700">
                Tax rates and regulations vary by country and product category. This calculator provides estimates only. 
                Please consult with tax professionals and customs authorities for accurate tax obligations. 
                Zapow is not responsible for tax compliance or accuracy of calculations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}