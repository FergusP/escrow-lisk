"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter, ArrowUpRight, ArrowDownLeft, DollarSign, Send, Wallet, FileText } from "lucide-react";
import { getCurrentUser, getTransactionsByUser } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";

export default function TransactionsPage() {
  const currentUser = getCurrentUser();
  const transactions = getTransactionsByUser(currentUser.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'received':
      case 'released':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawn':
      case 'funded':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-gray-600">View all your payment history and activities</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Stats */}
      <div className="stats-grid">
        <Card className="gradient-card-green hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-green-500">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-green-900">$45,000</div>
            <div className="stats-label text-green-700">Total Received</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-red hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-red-500">
              <Send className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-red-900">$20,000</div>
            <div className="stats-label text-red-700">Total Withdrawn</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-blue hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-blue-500">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-blue-900">$25,000</div>
            <div className="stats-label text-blue-700">Current Balance</div>
          </CardContent>
        </Card>
        <Card className="gradient-card-purple hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-purple-500">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-purple-900">32</div>
            <div className="stats-label text-purple-700">Total Transactions</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {transaction.type === 'received' || transaction.type === 'released' ? 'From' : 'To'}{' '}
                        {transaction.from || transaction.to}
                      </p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    transaction.type === 'received' || transaction.type === 'released'
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'received' || transaction.type === 'released' ? '+' : '-'}
                    ${transaction.amount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500">{transaction.currency}</p>
                  {transaction.contractId && (
                    <p className="text-xs text-blue-600">Contract #{transaction.contractId}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More */}
          <div className="mt-6 text-center">
            <Button variant="outline">Load More Transactions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}