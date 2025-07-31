"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip
} from "recharts";
import { 
  getCurrentUser, 
  getContractsByUser, 
  getTransactionsByUser,
  mockEarningsData,
  mockUsers
} from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { 
  TrendingUp, 
  DollarSign, 
  FileText,
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  Activity,
  Globe,
  ShoppingCart,
  Store
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const currentUser = getCurrentUser();
  const userContracts = getContractsByUser(currentUser.id);
  const userTransactions = getTransactionsByUser(currentUser.id);
  const [activeTab, setActiveTab] = useState("all");
  
  // Separate contracts by role
  const buyerContracts = userContracts.filter(c => c.buyer.id === currentUser.id);
  const sellerContracts = userContracts.filter(c => c.seller.id === currentUser.id);
  
  // Active contracts based on selected tab
  const getActiveContracts = () => {
    let contracts = userContracts;
    if (activeTab === "buyer") contracts = buyerContracts;
    if (activeTab === "seller") contracts = sellerContracts;
    return contracts.filter(c => c.status !== 'completed');
  };
  
  const activeContracts = getActiveContracts();
  
  // Recent transactions
  const recentTransactions = userTransactions.slice(0, 4);

  // Stats
  const totalEarnings = userTransactions
    .filter(t => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'funded': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'received': return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'sent': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'released': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getTimeOfDay()}, {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your escrow business today.
          </p>
        </div>
        <Link href="/contracts/new">
          <Button className="btn-premium bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">As Seller - Earnings</p>
                <p className="text-3xl font-bold text-green-900 mb-1">${totalEarnings.toLocaleString()}</p>
                <div className="flex items-center text-green-600 text-sm">
                  <Store className="h-4 w-4 mr-1" />
                  <span>{sellerContracts.length} sales</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Active Contracts</p>
                <p className="text-3xl font-bold text-blue-900 mb-1">{activeContracts.length}</p>
                <div className="flex items-center text-blue-600 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{activeContracts.filter(c => c.status === 'active').length} awaiting payment</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">As Buyer - Purchases</p>
                <p className="text-3xl font-bold text-purple-900 mb-1">{buyerContracts.length}</p>
                <div className="flex items-center text-purple-600 text-sm">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  <span>{buyerContracts.filter(c => c.status === 'completed').length} completed</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-orange-900 mb-1">98.5%</p>
                <div className="flex items-center text-orange-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Industry leading</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contracts and Transactions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Contracts with Role Tabs */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Active Contracts</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{activeContracts.length} contracts in progress</p>
                </div>
                <Link href="/contracts">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View all <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    All ({userContracts.filter(c => c.status !== 'completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="buyer" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    As Buyer ({buyerContracts.filter(c => c.status !== 'completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="seller" className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    As Seller ({sellerContracts.filter(c => c.status !== 'completed').length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4">
              {activeContracts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active contracts</h3>
                  <p className="text-gray-500 mb-4">Create your first contract to start secure trading</p>
                  <Link href="/contracts/new">
                    <Button className="btn-premium">Create Contract</Button>
                  </Link>
                </div>
              ) : (
                activeContracts.slice(0, 3).map((contract) => {
                  const isBuyer = contract.buyer.id === currentUser.id;
                  const counterparty = isBuyer ? contract.seller : contract.buyer;
                  
                  return (
                    <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover-lift">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarImage src={counterparty.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {counterparty.company.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{counterparty.company}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="h-4 w-4" />
                            <span>{counterparty.country}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {isBuyer ? (
                                <><ShoppingCart className="h-3 w-3 mr-1" /> Buying from</>  
                              ) : (
                                <><Store className="h-3 w-3 mr-1" /> Selling to</>  
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        ${contract.amount.toLocaleString()}
                      </div>
                      <Badge className={`${getStatusColor(contract.status)} border font-medium`}>
                        {contract.status}
                      </Badge>
                      <div className="flex items-center gap-1 mt-2">
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                    </div>
                  );
                })
              )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Recent Transactions</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Your latest payment activity</p>
                </div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View all <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover-lift">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.to}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'received' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.type === 'received' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">{transaction.currency}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analytics and Contacts */}
        <div className="space-y-8">
          {/* Earnings Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Earnings Overview</CardTitle>
              <p className="text-sm text-gray-600">Last 6 months performance</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockEarningsData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Top Clients</CardTitle>
              <p className="text-sm text-gray-600">Your most valuable partners</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUsers.slice(1, 4).map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover-lift">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.company}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="h-3 w-3" />
                      <span>{user.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total value</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}