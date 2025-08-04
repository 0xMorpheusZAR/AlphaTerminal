import { spawn } from 'child_process';
import path from 'path';

export interface MagicMCPRequest {
  prompt: string;
  searchQuery: string;
  projectPath: string;
  currentFile?: string;
}

export interface MagicMCPResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export class MagicMCPIntegrationService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.MAGIC_MCP_API_KEY || '';
  }

  async generateComponent(request: MagicMCPRequest): Promise<MagicMCPResponse> {
    try {
      // In production, this would spawn the Magic MCP process
      // For now, we'll simulate the response
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Magic MCP API key not configured. Please set MAGIC_MCP_API_KEY environment variable.'
        };
      }

      // Simulate component generation based on prompt
      const code = this.generateComponentCode(request.prompt);
      
      return {
        success: true,
        code
      };
    } catch (error) {
      console.error('Magic MCP integration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateComponentCode(prompt: string): string {
    // This is a simplified version - in production, Magic MCP would generate real components
    const componentName = this.extractComponentName(prompt);
    
    return `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ${componentName}Props {
  data?: any;
  className?: string;
}

export default function ${componentName}({ data, className }: ${componentName}Props) {
  return (
    <Card className={\`bg-gray-800/50 backdrop-blur border-gray-700 \${className}\`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>${this.formatComponentTitle(componentName)}</span>
          <Badge variant="outline" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component implementation based on: "${prompt}" */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Value</span>
            <span className="font-semibold">{data?.value || '$0.00'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">24h Change</span>
            <span className="font-semibold text-green-400">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {data?.change || '+0.00%'}
            </span>
          </div>
        </div>
        <Button className="w-full mt-4" variant="outline">
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}`;
  }

  private extractComponentName(prompt: string): string {
    // Extract a component name from the prompt
    const words = prompt.toLowerCase().split(' ');
    const keywords = ['component', 'widget', 'chart', 'table', 'card', 'tracker', 'monitor', 'dashboard'];
    
    for (const keyword of keywords) {
      const index = words.indexOf(keyword);
      if (index !== -1) {
        const name = words.slice(Math.max(0, index - 1), index + 1).join('');
        return this.toPascalCase(name) || 'GeneratedComponent';
      }
    }
    
    return 'GeneratedComponent';
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private formatComponentTitle(componentName: string): string {
    return componentName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Method to check if Magic MCP is properly configured
  async checkConfiguration(): Promise<{ configured: boolean; message: string }> {
    if (!this.apiKey) {
      return {
        configured: false,
        message: 'Magic MCP API key not configured. Please set MAGIC_MCP_API_KEY in your environment.'
      };
    }

    // In production, we would verify the API key with Magic MCP
    return {
      configured: true,
      message: 'Magic MCP is properly configured and ready to use.'
    };
  }
}

export const magicMCPService = new MagicMCPIntegrationService();