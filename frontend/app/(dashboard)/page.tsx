"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  getCurrentUser, 
  getContractsByUser, 
  getTransactionsByUser,
  mockEarningsData,
  mockUsers
} from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const currentUser = getCurrentUser();
  const userContracts = getContractsByUser(currentUser.id);
  const userTransactions = getTransactionsByUser(currentUser.id);
  
  // Active contracts (not completed)
  const activeContracts = userContracts.filter(c => c.status !== 'completed');
  
  // Recent transactions
  const recentTransactions = userTransactions.slice(0, 4);

  // Stats
  const totalEarnings = userTransactions
    .filter(t => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good afternoon, {currentUser.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 flex items-center gap-1">
          Welcome back! 
          <span className="text-lg">👋</span>
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contracts and Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Contracts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Your Active Contracts • {activeContracts.length}
              </CardTitle>
              <Button variant="ghost" size="sm">•••</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeContracts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active contracts</p>
              ) : (
                activeContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contract.seller.avatar} />
                        <AvatarFallback>
                          {contract.seller.company.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{contract.seller.company}</h3>
                        <p className="text-sm text-gray-600">{contract.seller.country}</p>
                        <p className="text-xs text-gray-500">Contract Period</p>
                        <p className="text-xs font-medium">{contract.period}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        ${contract.amount.toLocaleString()}
                      </div>
                      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                        {contract.status === 'active' ? 'Fixed Rate' : contract.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Name of client</p>
                      <p className="text-xs font-medium">{contract.buyer.name}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
              <Button variant="ghost" size="sm">•••</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {transaction.type === 'received' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'received' ? 'From' : 'To'} {transaction.from || transaction.to}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'received' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.type === 'received' ? 'Amount Received' : 'Amount Withdrawn'}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Clients */}
        <div className="space-y-6">
          {/* Earnings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Money Earned • 2021</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockEarningsData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                    />
                    <YAxis hide />
                    <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                      {mockEarningsData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === mockEarningsData.length - 1 ? "#3b82f6" : "#e5e7eb"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
                <span>1m</span>
                <span>3m</span>
                <span className="font-semibold">6m</span>
                <span>1y</span>
              </div>
            </CardContent>
          </Card>

          {/* Client Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Your Client Contact</CardTitle>
              <Button variant="ghost" size="sm">•••</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUsers.slice(1, 4).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Contact Client
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Updates Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Update</span>
                <span className="text-blue-600 font-medium">Transaction</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Awaiting NDA Document</p>
                  <p className="text-xs text-gray-500">Austergo Ltd.</p>
                </div>
                <span className="text-xs text-gray-500">10 Aug 2021</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Money Received</p>
                  <p className="text-xs text-gray-500">Barly Vallendita - Wise</p>
                  <p className="text-sm font-semibold text-green-600">$5,000</p>
                </div>
                <span className="text-xs text-gray-500">10 Aug 2021</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}