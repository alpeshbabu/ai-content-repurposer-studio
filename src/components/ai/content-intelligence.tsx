'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Target,
  TrendingUp,
  Search,
  Globe,
  Shield,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentAnalysis {
  qualityScore: {
    overall: number;
    readability: number;
    engagement: number;
    seoOptimization: number;
    clarity: number;
    tone: number;
    structure: number;
  };
  suggestions: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
    example?: string;
  }>;
  sentimentAnalysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  readingLevel: string;
  wordCount: number;
  estimatedReadingTime: number;
  targetAudience: string[];
  strengths: string[];
  weaknesses: string[];
}

export default function ContentIntelligence() {
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('quality');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  
  // Form states
  const [contentType, setContentType] = useState('blog');
  const [targetPlatform, setTargetPlatform] = useState('twitter');
  const [targetAudience, setTargetAudience] = useState('general');
  const [industry, setIndustry] = useState('technology');

  const analyzeContent = async () => {
    if (!content.trim()) {
      toast.error('Please enter content to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          contentType,
          analysisType: 'quality',
          targetPlatform,
          targetAudience,
          industry
        })
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data);
        toast.success('Analysis completed successfully');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze content');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Content Intelligence
          </h1>
          <p className="text-muted-foreground">
            AI-powered content analysis and optimization
          </p>
        </div>
      </div>

      {/* Content Input */}
      <Card>
        <CardHeader>
          <CardTitle>Content Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ad">Advertisement</SelectItem>
                  <SelectItem value="product">Product Description</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetPlatform">Target Platform</Label>
              <Select value={targetPlatform} onValueChange={setTargetPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., young professionals"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content to Analyze</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content here for analysis..."
              className="min-h-32"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{content.length} characters</span>
              <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Content Quality Analysis</h3>
          <Button onClick={analyzeContent} disabled={loading}>
            {loading ? <Skeleton className="h-4 w-16" /> : 'Analyze Quality'}
          </Button>
        </div>

        {analysis && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quality Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysis.qualityScore).map(([key, score]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-medium">{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Content Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Content Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{analysis.wordCount}</div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{analysis.estimatedReadingTime}m</div>
                      <div className="text-xs text-muted-foreground">Reading Time</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{analysis.readingLevel}</div>
                      <div className="text-xs text-muted-foreground">Reading Level</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{analysis.sentimentAnalysis.sentiment}</div>
                      <div className="text-xs text-muted-foreground">Sentiment</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Target Audience</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.targetAudience.map((audience) => (
                      <Badge key={audience} variant="outline" className="text-xs">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(suggestion.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(suggestion.severity) as any} className="text-xs">
                            {suggestion.severity}
                          </Badge>
                          <span className="text-sm font-medium capitalize">
                            {suggestion.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {suggestion.message}
                        </p>
                        <p className="text-sm">
                          <strong>Suggestion:</strong> {suggestion.suggestion}
                        </p>
                        {suggestion.example && (
                          <p className="text-sm mt-1">
                            <strong>Example:</strong> {suggestion.example}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 