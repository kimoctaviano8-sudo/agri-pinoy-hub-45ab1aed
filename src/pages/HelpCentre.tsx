import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Book, MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}
interface SupportArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  helpful: number;
}
const HelpCentre = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = [{
    id: 'all',
    name: 'All Topics',
    count: 24
  }, {
    id: 'account',
    name: 'Account & Profile',
    count: 8
  }, {
    id: 'orders',
    name: 'Orders & Payments',
    count: 6
  }, {
    id: 'products',
    name: 'Products & Services',
    count: 5
  }, {
    id: 'scanner',
    name: 'Plant Scanner',
    count: 3
  }, {
    id: 'technical',
    name: 'Technical Support',
    count: 2
  }];
  const faqs: FAQ[] = [{
    id: '1',
    question: 'How do I reset my password?',
    answer: 'To reset your password, go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your email.',
    category: 'account',
    tags: ['password', 'login', 'security']
  }, {
    id: '2',
    question: 'How does the Plant Scanner work?',
    answer: 'The Plant Scanner uses AI technology to identify plant diseases and pests. Simply take a clear photo of the affected plant part, and our system will analyze it and provide recommendations.',
    category: 'scanner',
    tags: ['scanner', 'ai', 'diagnosis']
  }, {
    id: '3',
    question: 'How can I track my order?',
    answer: 'You can track your order by going to "My Purchases" in your profile. Click on the order you want to track to see its current status and estimated delivery time.',
    category: 'orders',
    tags: ['tracking', 'orders', 'delivery']
  }, {
    id: '4',
    question: 'What payment methods do you accept?',
    answer: 'We accept various payment methods including credit/debit cards, GCash, PayMaya, and bank transfers. Cash on delivery is also available in selected areas.',
    category: 'orders',
    tags: ['payment', 'gcash', 'cod']
  }, {
    id: '5',
    question: 'How do I cancel my order?',
    answer: 'You can cancel your order within 24 hours of placing it. Go to "My Purchases", find your order, and click the "Cancel" button. For orders that have already been processed, please contact our support team.',
    category: 'orders',
    tags: ['cancel', 'refund', 'orders']
  }, {
    id: '6',
    question: 'How do I update my profile information?',
    answer: 'To update your profile, go to your Profile page and click the "Edit Profile" button. You can update your name, email, phone number, and location.',
    category: 'account',
    tags: ['profile', 'update', 'personal info']
  }];
  const articles: SupportArticle[] = [{
    id: '1',
    title: 'Getting Started with Gemini Agriculture',
    excerpt: 'A comprehensive guide to help you navigate and make the most of our platform.',
    category: 'account',
    readTime: '5 min read',
    helpful: 124
  }, {
    id: '2',
    title: 'Plant Disease Identification Guide',
    excerpt: 'Learn how to take better photos for accurate plant disease diagnosis.',
    category: 'scanner',
    readTime: '8 min read',
    helpful: 89
  }, {
    id: '3',
    title: 'Understanding Your Order Status',
    excerpt: 'Detailed explanation of each order status and what they mean.',
    category: 'orders',
    readTime: '3 min read',
    helpful: 67
  }, {
    id: '4',
    title: 'Troubleshooting Common Issues',
    excerpt: 'Solutions to frequently encountered technical problems.',
    category: 'technical',
    readTime: '10 min read',
    helpful: 45
  }];
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) || faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Help Centre</h1>
              <p className="text-sm text-muted-foreground">Find answers and support</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search for help..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {/* Quick Contact Options */}
        <div>
          <a href="tel:09193572488">
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer h-20">
              <div className="flex items-center gap-3 h-full">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Call Now</p>
                  <p className="text-xs text-muted-foreground truncate">09193572488</p>
                </div>
              </div>
            </Card>
          </a>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-base font-semibold mb-3">Browse by Category</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory touch-pan-x">
            {categories.map(category => <Button key={category.id} variant={selectedCategory === category.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category.id)} className="whitespace-nowrap snap-start flex-shrink-0">
                {category.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>)}
          </div>
        </div>

        {/* FAQs Section */}
        {filteredFAQs.length > 0 && <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Book className="w-4 h-4" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {filteredFAQs.map(faq => <Card key={faq.id} className="p-0 overflow-hidden">
                  <details className="group">
                    <summary className="p-4 cursor-pointer hover:bg-muted/50 transition-colors list-none flex items-center justify-between">
                      <span className="font-medium text-sm">{faq.question}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t bg-muted/30">
                      <p className="pt-3">{faq.answer}</p>
                      <div className="flex gap-1 mt-3">
                        {faq.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>)}
                      </div>
                    </div>
                  </details>
                </Card>)}
            </div>
          </div>}

        {/* Support Articles */}
        {filteredArticles.length > 0 && <div>
            <h2 className="text-base font-semibold mb-3">Support Articles</h2>
            <div className="space-y-3">
              {filteredArticles.map(article => <Card key={article.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">{article.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{article.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{article.readTime}</span>
                        <span>•</span>
                        <span>{article.helpful} people found this helpful</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
                  </div>
                </Card>)}
            </div>
          </div>}

        {/* No Results */}
        {filteredFAQs.length === 0 && filteredArticles.length === 0 && searchQuery && <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or browse our categories above.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
              <Link to="/gemini-cares">
                <Button>Contact Support</Button>
              </Link>
            </div>
          </div>}

        {/* Contact Information */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold mb-3">Still need help?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>Email: geminicares@geminiagri.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Phone: 09193572488</span>
            </div>
            <p className="text-muted-foreground mt-3">Our support team is available weekdays 8AM to 5PM to assist you with any questions or concerns.</p>
          </div>
        </Card>
      </div>
    </div>;
};
export default HelpCentre;