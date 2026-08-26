import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface AiInsightPanelProps {
  entityType: string;
  entityId: string;
  insightType: string;
  className?: string;
  title?: string;
  description?: string;
}

export function AiInsightPanel({ 
  entityType, 
  entityId, 
  insightType, 
  className,
  title,
  description
}: AiInsightPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = ['ai-insights', entityType, entityId, insightType];

  const { data: insights, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await api.get(`/ai/insights/${entityType}/${entityId}`);
      return data?.filter((i: any) => i.insight_type === insightType) || [];
    },
    enabled: !!entityId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/ai/insights/generate', {
        entityType,
        entityId,
        insightType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const latestInsight = insights?.[0];
  const isGenerating = generateMutation.isPending;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!latestInsight) {
      return (
        <div className="text-center p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {description || t('settings.ai.no_insight_yet')}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
            )}
            {t('settings.ai.generate_button')}
          </Button>
        </div>
      );
    }

    const content = latestInsight.content;

    // Custom rendering based on insightType
    if (insightType === 'win_probability') {
      const score = content.score || 0;
      const colorClass = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">{t('settings.ai.win_probability')}</span>
              <div className={cn("text-3xl font-bold", colorClass)}>
                {score}%
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating}
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            </Button>
          </div>
          
          {content.factors && content.factors.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">{t('settings.ai.key_factors')}</span>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                {content.factors.map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {content.recommendation && (
            <div className="bg-muted p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <p className="text-sm">{content.recommendation}</p>
            </div>
          )}
        </div>
      );
    }

    if (insightType === 'summary') {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
              {t('settings.ai.regenerate')}
            </Button>
          </div>
          <div className="text-sm bg-muted/50 p-3 rounded-md">
            {content.summary}
          </div>
          {content.action_items && content.action_items.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">{t('settings.ai.action_items')}</span>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                {content.action_items.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Generic JSON render
    return (
      <div className="space-y-2">
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(content, null, 2)}
        </pre>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => generateMutation.mutate()}
          disabled={isGenerating}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
          {t('common.refresh')}
        </Button>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5", className)}>
      <CardHeader className="pb-3 border-b border-primary/10 bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
          <Sparkles className="w-4 h-4" />
          {title || t('settings.ai.insights_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
