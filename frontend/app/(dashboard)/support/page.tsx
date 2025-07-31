"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  Video,
  ExternalLink,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getCurrentUser, getSupportTicketsByUser, SupportTicket } from "@/lib/mock-data";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface ResourceItem {
  id: string;
  title: string;
  type: 'guide' | 'video' | 'tutorial' | 'documentation';
  description: string;
  url: string;
  duration?: string;
  category: string;
}


const mockFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How long does it take to release escrow funds?',
    answer: 'Once both parties confirm delivery completion, funds are typically released within 5-10 minutes through our automated smart contract system.',
    category: 'Escrow',
    helpful: 28
  },
  {
    id: '2',
    question: 'What happens if there\'s a dispute?',
    answer: 'Disputed transactions are reviewed by our mediation team within 24-48 hours. We examine all evidence and communications to make a fair decision.',
    category: 'Disputes',
    helpful: 19
  },
  {
    id: '3',
    question: 'Are there any hidden fees?',
    answer: 'No hidden fees. We charge a transparent 1% platform fee on successful transactions, clearly shown before you confirm any contract.',
    category: 'Fees',
    helpful: 35
  },
  {
    id: '4',
    question: 'How do I upload compliance documents?',
    answer: 'Go to Compliance section, click Upload Document, select your file type, and drag & drop or browse to upload. We support PDF, PNG, JPG, and DOC formats.',
    category: 'Documents',
    helpful: 22
  },
  {
    id: '5',
    question: 'Can I cancel a contract after creation?',
    answer: 'Contracts can be cancelled by mutual agreement before funding. Once funded, cancellation requires both parties\' consent or dispute resolution.',
    category: 'Contracts',
    helpful: 41
  }
];

const mockResources: ResourceItem[] = [
  {
    id: '1',
    title: 'Getting Started with Zapow',
    type: 'guide',
    description: 'Complete guide to creating your first escrow contract',
    url: '#',
    category: 'Getting Started'
  },
  {
    id: '2',
    title: 'International Trade Compliance',
    type: 'documentation',
    description: 'Understanding required documents for cross-border trade',
    url: '#',
    category: 'Compliance'
  },
  {
    id: '3',
    title: 'How to Create an Escrow Contract',
    type: 'video',
    description: 'Step-by-step video walkthrough of contract creation',
    url: '#',
    duration: '8:32',
    category: 'Tutorials'
  },
  {
    id: '4',
    title: 'Tax Calculation Guide',
    type: 'tutorial',
    description: 'Learn how to calculate duties and taxes for international shipments',
    url: '#',
    category: 'Taxes'
  },
  {
    id: '5',
    title: 'Dispute Resolution Process',
    type: 'guide',
    description: 'What to expect during dispute mediation',
    url: '#',
    category: 'Disputes'
  }
];

export default function SupportPage() {
  const currentUser = getCurrentUser();
  const tickets = getSupportTicketsByUser(currentUser.id);
  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'guide': return <Book className="h-5 w-5" />;
      case 'tutorial': return <FileText className="h-5 w-5" />;
      case 'documentation': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Center</h1>
          <p className="text-gray-600">Get help and find answers to your questions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-gray-600">Average response: 2 min</p>
                <p className="text-xs text-green-600">● Available now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-gray-600">support@zapow.com</p>
                <p className="text-xs text-gray-500">Response within 4 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Phone Support</h3>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                <p className="text-xs text-gray-500">Mon-Fri 9AM-6PM PST</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search help articles, FAQs, or describe your issue..." 
              className="pl-12 py-3 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tickets & FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Support Tickets</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{ticket.id}</span>
                        <Badge className={getTicketStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">{ticket.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                        <span>{ticket.responses} responses</span>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {tickets.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No tickets yet</h3>
                  <p className="text-gray-600 mb-4">Create a ticket when you need help</p>
                  <Button>Create First Ticket</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFAQs.map((faq) => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{faq.question}</h4>
                      <Badge variant="outline" className="text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{faq.answer}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{faq.helpful} people found this helpful</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          👍 Helpful
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          👎 Not helpful
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Resources & Create Ticket */}
        <div className="space-y-6">
          {/* Create Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="contract">Contract Questions</SelectItem>
                      <SelectItem value="general">General Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input placeholder="Brief description of your issue" />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea 
                    placeholder="Please provide detailed information about your issue..."
                    rows={4}
                  />
                </div>
                
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Help Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockResources.map((resource) => (
                  <div key={resource.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{resource.title}</h4>
                        {resource.duration && (
                          <Badge variant="outline" className="text-xs">
                            {resource.duration}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{resource.description}</p>
                      <p className="text-xs text-blue-600">{resource.category}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Resources
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Platform Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blockchain Network</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Processing</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-600">Maintenance</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                View Status Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}