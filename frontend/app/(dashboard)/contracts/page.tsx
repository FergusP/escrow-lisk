"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  Filter,
  Eye,
  MoreHorizontal,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Users
} from "lucide-react";
import { getCurrentUser, getContractsByUser } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function ContractsPage() {
  const currentUser = getCurrentUser();
  const contracts = getContractsByUser(currentUser.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'funded': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Clock className="h-4 w-4" />;
      case 'funded': return <DollarSign className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    value: contracts.reduce((sum, c) => sum + c.amount, 0)
  };

  return (
    <div className="content-spacing">
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contracts</h1>
          <p className="text-gray-600 text-lg">
            Manage your escrow contracts and track their progress
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
      <div className="stats-grid">
        <Card className="gradient-card-blue hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-blue-500">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-blue-900">{stats.total}</div>
            <div className="stats-label text-blue-700">Total Contracts</div>
          </CardContent>
        </Card>

        <Card className="gradient-card-blue hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-blue-500">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-blue-900">{stats.active}</div>
            <div className="stats-label text-blue-700">Active</div>
          </CardContent>
        </Card>

        <Card className="gradient-card-green hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-green-500">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-green-900">{stats.completed}</div>
            <div className="stats-label text-green-700">Completed</div>
          </CardContent>
        </Card>

        <Card className="gradient-card-orange hover-lift shadow-lg">
          <CardContent className="stats-card-content">
            <div className="stats-icon bg-orange-500">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div className="stats-value text-orange-900">${stats.value.toLocaleString()}</div>
            <div className="stats-label text-orange-700">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="modern-card">
        <CardContent className="p-0">
          <div className="filter-bar">
            <div className="filter-input">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Search contracts..." 
                  className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl" 
                />
              </div>
            </div>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-44 h-12 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-roles">
              <SelectTrigger className="w-36 h-12 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-roles">All Roles</SelectItem>
                <SelectItem value="buyer">As Buyer</SelectItem>
                <SelectItem value="seller">As Seller</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card className="modern-card">
        <CardHeader className="pb-6">
          <div className="flex-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">All Contracts</CardTitle>
              <p className="text-gray-600">Your complete contract history</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="card-spacing">
            {contracts.map((contract) => (
              <div key={contract.id} className="contract-item">
                <div className="flex items-center gap-8">
                  {/* Contract Parties */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={contract.seller.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {contract.seller.company.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{contract.seller.company}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Globe className="h-3 w-3" />
                        <span>{contract.seller.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-8 h-px bg-gray-300"></div>
                  </div>

                  {/* Buyer */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={contract.buyer.avatar} />
                      <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                        {contract.buyer.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{contract.buyer.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>Buyer</span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div>
                    <p className="font-medium text-gray-900">#{contract.contractNumber}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(contract.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{contract.description}</p>
                  </div>
                </div>

                {/* Right Side - Amount, Status, Actions */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ${contract.amount.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">{contract.currency}</p>
                  </div>

                  <div className="text-center">
                    <Badge className={`${getStatusColor(contract.status)} border font-medium mb-2`}>
                      {getStatusIcon(contract.status)}
                      <span className="ml-1 capitalize">{contract.status}</span>
                    </Badge>
                    <p className="text-xs text-gray-600 font-medium">{contract.period}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/contracts/${contract.id}`}>
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-700">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {contracts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No contracts yet</h3>
              <p className="text-gray-600 mb-6">Create your first contract to start secure trading</p>
              <Link href="/contracts/new">
                <Button className="btn-premium bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Contract
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}