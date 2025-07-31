"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Download, Eye, MoreHorizontal, FileText, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { getCurrentUser, getInvoicesByUser } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function InvoicesPage() {
  const currentUser = getCurrentUser();
  const invoices = getInvoicesByUser(currentUser.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage your trade invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card className="gradient-card-blue hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-blue-500">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-blue-900">12</div>
            <div className="stats-label text-blue-700">Total Invoices</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-green hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-green-500">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-green-900">8</div>
            <div className="stats-label text-green-700">Paid</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-orange hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-orange-500">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-orange-900">2</div>
            <div className="stats-label text-orange-700">Pending</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-red hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-red-500">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-red-900">2</div>
            <div className="stats-label text-red-700">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="30">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">
                      {invoice.invoiceNumber.split('-')[2]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      To: {invoice.buyer.company}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      ${invoice.total.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">{invoice.currency}</p>
                    {invoice.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty State */}
          {invoices.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
              <p className="text-gray-600 mb-4">Create your first invoice to get started with secure payments</p>
              <Link href="/invoices/new">
                <Button>Create Invoice</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}