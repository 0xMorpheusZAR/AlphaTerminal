import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wand2, Sparkles, Code, Copy, Check, ArrowRight, 
  Palette, Layout, Component, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  timestamp: Date;
  type: 'chart' | 'widget' | 'table' | 'custom';
}

export default function MagicUIGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComponents, setGeneratedComponents] = useState<GeneratedComponent[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const examplePrompts = [
    {
      title: "Price Alert Widget",
      prompt: "Create a crypto price alert widget with threshold settings and notification badges",
      type: "widget" as const
    },
    {
      title: "Portfolio Tracker",
      prompt: "Build a portfolio tracking card showing total value, 24h change, and top holdings",
      type: "widget" as const
    },
    {
      title: "Liquidity Pool Chart",
      prompt: "Design a liquidity pool visualization chart with TVL and APY metrics",
      type: "chart" as const
    },
    {
      title: "Token Analytics Table",
      prompt: "Create a sortable table for token analytics with market cap, volume, and price changes",
      type: "table" as const
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/magic-mcp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          searchQuery: prompt.split(' ').slice(0, 4).join(' '),
          projectPath: window.location.origin,
          currentFile: 'coingecko-pro-dashboard'
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newComponent: GeneratedComponent = {
          id: Date.now().toString(),
          prompt: prompt,
          code: result.code,
          timestamp: new Date(),
          type: detectComponentType(prompt)
        };

        setGeneratedComponents([newComponent, ...generatedComponents]);
        setPrompt('');
        setActiveTab('history');
      } else {
        // Fallback to mock if API fails
        const newComponent: GeneratedComponent = {
          id: Date.now().toString(),
          prompt: prompt,
          code: generateMockCode(prompt),
          timestamp: new Date(),
          type: detectComponentType(prompt)
        };

        setGeneratedComponents([newComponent, ...generatedComponents]);
        setPrompt('');
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error generating component:', error);
      // Fallback to mock
      const newComponent: GeneratedComponent = {
        id: Date.now().toString(),
        prompt: prompt,
        code: generateMockCode(prompt),
        timestamp: new Date(),
        type: detectComponentType(prompt)
      };

      setGeneratedComponents([newComponent, ...generatedComponents]);
      setPrompt('');
      setActiveTab('history');
    } finally {
      setIsGenerating(false);
    }
  };

  const detectComponentType = (prompt: string): 'chart' | 'widget' | 'table' | 'custom' => {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('chart') || lowerPrompt.includes('graph')) return 'chart';
    if (lowerPrompt.includes('table') || lowerPrompt.includes('list')) return 'table';
    if (lowerPrompt.includes('widget') || lowerPrompt.includes('card')) return 'widget';
    return 'custom';
  };

  const generateMockCode = (prompt: string) => {
    // This is a mock - in production, Magic MCP would generate real components
    return `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Generated component based on: "${prompt}"
export default function GeneratedComponent() {
  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
      <CardHeader>
        <CardTitle>AI Generated Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">
          Component generated based on your prompt.
        </p>
        <Badge className="mt-2">Powered by Magic MCP</Badge>
      </CardContent>
    </Card>
  );
}`;
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const typeColors = {
    chart: 'bg-blue-500',
    widget: 'bg-purple-500',
    table: 'bg-green-500',
    custom: 'bg-orange-500'
  };

  const typeIcons = {
    chart: Layout,
    widget: Component,
    table: Layout,
    custom: Sparkles
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-purple-400" />
              Magic UI Generator
            </CardTitle>
            <CardDescription>
              Generate custom crypto dashboard components with AI
            </CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Powered by 21st.dev
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="history">History ({generatedComponents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your component</label>
              <Textarea
                placeholder="E.g., Create a real-time crypto price tracker with candlestick charts..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] bg-gray-700/50 border-gray-600 focus:border-purple-400"
              />
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Component
                  </>
                )}
              </Button>
            </div>

            {/* Example Prompts */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quick Start Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {examplePrompts.map((example, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card 
                      className="bg-gray-700/50 border-gray-600 cursor-pointer hover:border-purple-400 transition-colors"
                      onClick={() => setPrompt(example.prompt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{example.title}</h4>
                            <p className="text-xs text-gray-400">{example.prompt}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Features */}
            <Alert className="bg-purple-500/10 border-purple-500/50">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Magic UI uses AI to generate production-ready React components tailored for crypto dashboards.
                Components include TypeScript support, Tailwind CSS styling, and integration with shadcn/ui.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {generatedComponents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No components generated yet</p>
                <p className="text-sm mt-1">Start by describing a component you need</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {generatedComponents.map((component) => {
                    const Icon = typeIcons[component.type];
                    return (
                      <motion.div
                        key={component.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Card className="bg-gray-700/50 border-gray-600">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-8 h-8 ${typeColors[component.type]} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-white" />
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {component.type}
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    {component.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium">{component.prompt}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(component.code, component.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                {copiedId === component.id ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="relative">
                              <pre className="text-xs bg-gray-900/50 p-3 rounded overflow-x-auto">
                                <code className="text-gray-300">{component.code}</code>
                              </pre>
                              <Badge 
                                className="absolute top-2 right-2 bg-gray-800 text-gray-400"
                                variant="outline"
                              >
                                <Code className="w-3 h-3 mr-1" />
                                TSX
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}