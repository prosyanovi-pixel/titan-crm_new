import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchWorkflowById, fetchRegistryActions, createWorkflow, updateWorkflow, validateWorkflow, Workflow, WorkflowStep } from '../../api/workflowAPI';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { TriggerNode, ActionNode } from './CustomNodes';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Button } from '@/components/ui/button';
import { Save, Plus, ArrowLeft, Loader2, List, LayoutGrid, Power, ShieldCheck, ShieldAlert, AlertTriangle, Search, Activity, Info } from 'lucide-react';
import dagre from 'dagre';
import { StepListView } from '@/modules/workflow/components/StepListView';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 256, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - 256 / 2,
        y: nodeWithPosition.y - 120 / 2,
      },
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

// Helper to topologically sort nodes to get linear step order
const getTopologicalSort = (currentNodes: Node[], currentEdges: Edge[]): string[] => {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  const adjacencyList = new Map<string, string[]>();
  currentNodes.forEach(n => adjacencyList.set(n.id, []));
  currentEdges.forEach(e => {
    if (adjacencyList.has(e.source)) {
      adjacencyList.get(e.source)!.push(e.target);
    }
  });

  const visit = (nodeId: string) => {
    if (temp.has(nodeId)) throw new Error('Cycle detected');
    if (!visited.has(nodeId)) {
      temp.add(nodeId);
      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(visit);
      temp.delete(nodeId);
      visited.add(nodeId);
      sorted.unshift(nodeId);
    }
  };

  if (adjacencyList.has('trigger')) visit('trigger');
  currentNodes.forEach(n => {
    if (!visited.has(n.id)) visit(n.id);
  });

  return sorted;
};


interface WorkflowCanvasProps {
  workflowId: string | null;
  onClose: () => void;
  onSaveComplete: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflowId, onClose, onSaveComplete }) => {
  const { t } = useTranslation();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>(() => workflowId ? 'list' : 'visual');
  const [validationResult, setValidationResult] = useState<{ valid: boolean, errors: string[], warnings?: string[] } | null>(null);

  const validateMutation = useMutation({
    mutationFn: () => validateWorkflow(workflowId!),
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.valid) {
        toast.success(t('workflows.toast.validation_success'));
      } else {
        toast.error(t('workflows.toast.validation_failed'));
      }
    },
    onError: () => {
      toast.error(t('workflows.toast.validation_error'));
    }
  });

  const [workflowData, setWorkflowData] = useState<Partial<Workflow>>({
    name: '',
    description: '',
    trigger_type: 'webhook',
    trigger_config: {},
    status: 'draft',
    steps: []
  });

  const { data: registryActions = [] } = useQuery({
    queryKey: ['workflow-registry-actions'],
    queryFn: fetchRegistryActions,
  });

  // Memoize registryActions to avoid re-renders
  const stableRegistryActions = useMemo(() => registryActions, [registryActions]);

  const { data: existingWorkflow, isFetching } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => fetchWorkflowById(workflowId!),
    enabled: !!workflowId,
  });

  // Initialize nodes and edges from workflow data
  useEffect(() => {
    if (workflowId && existingWorkflow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkflowData({
        ...existingWorkflow,
        trigger_type: (existingWorkflow as any).triggerType || existingWorkflow.trigger_type,
        trigger_config: (existingWorkflow as any).triggerConfig || existingWorkflow.trigger_config,
      });

      const initialSteps = (existingWorkflow.steps || []).map((s: any, i: number) => ({
        ...s,
        id: s.id || `step-${i}-${Date.now()}`,
      }));

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Trigger node
      newNodes.push({
        id: 'trigger',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { 
          trigger_type: existingWorkflow.trigger_type, 
          name: existingWorkflow.name,
          description: existingWorkflow.description,
          onClick: () => setSelectedNodeId('trigger')
        },
      });

      // Action nodes
      let prevNodeId = 'trigger';
      initialSteps.forEach((step: any, index: number) => {
        newNodes.push({
          id: step.id,
          type: 'action',
          position: { x: 0, y: (index + 1) * 150 },
          data: {
            step,
            index,
            onClick: () => setSelectedNodeId(step.id)
          }
        });

        newEdges.push({
          id: `e-${prevNodeId}-${step.id}`,
          source: prevNodeId,
          target: step.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        });

        prevNodeId = step.id;
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else if (!workflowId && nodes.length === 0) {
      setNodes([
        {
          id: 'trigger',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: { 
            trigger_type: 'webhook', 
            name: 'New Workflow',
            onClick: () => setSelectedNodeId('trigger')
          },
        }
      ]);
    }
  }, [workflowId, existingWorkflow]);

  // Update nodes data when workflowData changes
  useEffect(() => {
    setNodes((nds) => {
      // Pre-calculate action nodes index to avoid filtering on each map iteration
      const actionNodesMap = new Map<string, number>();
      let actionIndex = 0;
      nds.forEach((n) => {
        if (n.id !== 'trigger' && n.type === 'action') {
          actionNodesMap.set(n.id, actionIndex);
          actionIndex++;
        }
      });
      
      let hasChanges = false;
      const newNodes = nds.map((n) => {
        let newData;
        if (n.id === 'trigger') {
          newData = {
            ...n.data,
            trigger_type: workflowData.trigger_type,
            name: workflowData.name,
            description: workflowData.description,
            selected: selectedNodeId === 'trigger'
          };
        } else {
          const step = workflowData.steps?.find((s: any) => s.id === n.id);
          const index = actionNodesMap.get(n.id) || 0;
          const actionInfo = stableRegistryActions?.find((a: any) => a.module === step?.module && (a.name === step?.action || a.action === step?.action));
          const actionLabel = actionInfo?.label || step?.action || '';
          const moduleLabel = step?.module ? (t(`workflows.registry.modules.${step.module}`) || step.module) : '';
          
          newData = {
            ...n.data,
            step,
            index,
            actionLabel,
            moduleLabel,
            selected: selectedNodeId === n.id
          };
        }
        
        // Only mark as changed if the relevant fields actually differ
        const currentData = n.data as any;
        const isSame = 
          currentData.trigger_type === (newData as any).trigger_type &&
          currentData.name === (newData as any).name &&
          currentData.description === (newData as any).description &&
          currentData.selected === (newData as any).selected &&
          currentData.step === (newData as any).step &&
          currentData.index === (newData as any).index &&
          currentData.actionLabel === (newData as any).actionLabel &&
          currentData.moduleLabel === (newData as any).moduleLabel;
        
        if (!isSame) {
          hasChanges = true;
          return { ...n, data: newData };
        }
        return n;
      });
      
      // Return the original array if nothing changed to prevent infinite re-renders
      return hasChanges ? newNodes : nds;
    });
  }, [workflowData, selectedNodeId, stableRegistryActions]);

  const onConnect = useCallback(
    (params: Connection) => {
      // In a strict linear flow, we might want to prevent multiple outgoing edges from a node
      // But let's allow it visually, and linearize on save.
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    },
    [setEdges]
  );

  const handleAddStep = () => {
    const newId = `new-step-${Date.now()}`;
    const newStep = {
      id: newId,
      step_order: 999, // Will be re-calculated on save
      module: '',
      action: '',
      action_config: {},
      condition: null,
      delay_seconds: 0,
      on_fail: 'skip'
    };

    setWorkflowData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep] as any
    }));

    const newNode = {
      id: newId,
      type: 'action',
      position: { x: 250, y: nodes.length * 200 },
      data: {
        step: newStep,
        index: nodes.length - 1, // trigger doesn't count
        onClick: () => setSelectedNodeId(newId)
      }
    };

    // Auto-connect to the last node
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      setEdges((eds) => [...eds, {
        id: `e-${lastNode.id}-${newId}`,
        source: lastNode.id,
        target: newId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed }
      }]);
    }

    setNodes((nds) => [...nds, newNode]);
    
    // Auto-layout
    setTimeout(() => {
      setNodes((currentNodes) => {
        const { nodes: layoutedNodes } = getLayoutedElements(currentNodes, edges);
        return layoutedNodes;
      });
    }, 50);
  };

  const onUpdateWorkflow = (patch: Partial<Workflow>) => {
    setWorkflowData(prev => ({ ...prev, ...patch }));
  };

  const onUpdateStep = (id: string, patch: Partial<WorkflowStep>) => {
    setWorkflowData(prev => {
      const newSteps = (prev.steps || []).map((s: any) => 
        s.id === id ? { ...s, ...patch } : s
      );
      return { ...prev, steps: newSteps as any };
    });
  };

  const onRemoveStep = (id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    setWorkflowData(prev => ({
      ...prev,
      steps: prev.steps?.filter((s: any) => s.id !== id)
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!workflowData.name) throw new Error('Workflow name is required');

      // 1. Topologically sort nodes based on edges
      let sortedNodeIds;
      try {
        sortedNodeIds = getTopologicalSort(nodes, edges).filter(id => id !== 'trigger');
      } catch (e) {
        throw new Error("Cyclic dependency detected in workflow edges", { cause: e });
      }

      // 2. Map steps in correct order
      const stepsToSave = sortedNodeIds.map((id, index) => {
        const step = (workflowData.steps || []).find((s: any) => s.id === id);
        if (!step) return null;
        
        // Remove temp ID for saving
        const { id: tempId, ...rest } = step as any;
        return {
          ...rest,
          step_order: index + 1,
          condition: rest.condition?.field ? rest.condition : null,
        };
      }).filter(Boolean);

      const payloadToSave = {
        ...workflowData,
        steps: stepsToSave as any
      };

      if (workflowId) return updateWorkflow(workflowId, payloadToSave);
      return createWorkflow(payloadToSave);
    },
    onSuccess: () => {
      toast.success(workflowId ? t('workflows.toast.updated') : t('workflows.toast.created'));
      onSaveComplete();
    },
    onError: (err: any) => {
      toast.error(t('workflows.toast.save_error'), { description: err.message });
    }
  });

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="font-semibold text-sm">
                {workflowData.name || t('workflows.editor.title_new')}
              </h1>
              <Badge variant={workflowData.status === 'active' ? 'default' : 'outline'} className={cn(
                "h-5 text-[10px] uppercase px-1.5",
                workflowData.status === 'active' ? "bg-green-500 hover:bg-green-600" : ""
              )}>
                {t(`workflows.status.${workflowData.status || 'draft'}`)}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground opacity-70">
              {viewMode === 'visual' ? 'Visual Builder' : t('workflows.editor.step_by_step')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Toggle in Header */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border">
            <Power className={cn("w-3.5 h-3.5", workflowData.status === 'active' ? "text-green-500" : "text-slate-400")} />
            <Label htmlFor="wf-status-toggle" className="text-[11px] font-medium cursor-pointer uppercase">
               {workflowData.status === 'active' ? t('workflows.status.active') : t('workflows.status.draft')}
            </Label>
            <Switch 
              id="wf-status-toggle"
              checked={workflowData.status === 'active'}
              onCheckedChange={(checked) => onUpdateWorkflow({ status: checked ? 'active' : 'draft' })}
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Mode Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg">
             <Button 
               variant={viewMode === 'visual' ? 'secondary' : 'ghost'} 
               size="sm" 
               className="h-7 px-2.5 gap-1.5 text-xs shadow-none"
               onClick={() => setViewMode('visual')}
             >
               <LayoutGrid className="w-3.5 h-3.5" />
               Visual
             </Button>
             <Button 
               variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
               size="sm" 
               className="h-7 px-2.5 gap-1.5 text-xs shadow-none"
               onClick={() => setViewMode('list')}
             >
               <List className="w-3.5 h-3.5" />
               {t('workflows.editor.step_by_step')}
             </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Sonar Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-8 gap-2 rounded-full border-dashed",
                  validationResult?.valid === true && "border-green-500/50 text-green-600 bg-green-50/50",
                  validationResult?.valid === false && "border-red-500/50 text-red-600 bg-red-50/50"
                )}
                onClick={() => validateMutation.mutate()}
                disabled={validateMutation.isPending}
              >
                {validateMutation.isPending ? (
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                ) : validationResult?.valid === false ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider">Sonar</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
              <div className="bg-slate-50 dark:bg-zinc-900 px-4 py-3 border-b flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-tight flex items-center gap-2">
                  <Search className="w-3 h-3" />
                  {t('workflows.sonar.title')}
                </span>
                {validationResult && (
                   <Badge variant={validationResult.valid ? "default" : "destructive"} className="h-4 text-[9px] px-1">
                      {validationResult.valid ? 'PASSED' : 'ISSUE'}
                   </Badge>
                )}
              </div>
              <div className="p-4 space-y-3 max-h-[300px] overflow-auto">
                {!validationResult ? (
                  <div className="text-center py-4 text-muted-foreground text-xs italic">
                    {t('workflows.sonar.scanning')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {validationResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest px-1">
                           {t('workflows.sonar.errors')}
                        </p>
                        {validationResult.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-100 dark:border-red-900/30">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-red-700 dark:text-red-400 leading-snug">
                              {err}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {validationResult.warnings && validationResult.warnings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">
                           {t('workflows.sonar.warnings')}
                        </p>
                        {validationResult.warnings.map((warn, i) => (
                          <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-100 dark:border-amber-900/30">
                            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                              {warn}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {validationResult.valid && validationResult.errors.length === 0 && validationResult.warnings?.length === 0 && (
                       <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {t('workflows.sonar.valid')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900 px-4 py-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-7 text-[10px] uppercase font-bold text-primary"
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                >
                  {t('workflows.sonar.scan')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onLayout} disabled={viewMode !== 'visual'}>
              {t('workflows.actions.auto_layout')}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAddStep} className="gap-1">
              <Plus className="w-4 h-4" /> {t('workflows.editor.add_step_short')}
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1 px-4">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('workflows.actions.save')}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-slate-50/50 dark:bg-zinc-900/50">
          {viewMode === 'visual' ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              className="react-flow-custom"
            >
              <Controls />
              <MiniMap 
                nodeColor={(n) => {
                  if (n.type === 'trigger') return '#3b82f6';
                  if (n.data?.isError) return '#ef4444';
                  return '#94a3b8';
                }} 
              />
              <Background gap={16} size={1} />
            </ReactFlow>
          ) : (
            <StepListView 
              workflowData={workflowData}
              onUpdateWorkflow={onUpdateWorkflow}
              onUpdateStep={onUpdateStep}
              onRemoveStep={onRemoveStep}
              onSelectStep={(id) => setSelectedNodeId(id)}
              selectedStepId={selectedNodeId}
              registryActions={registryActions}
            />
          )}
        </div>

        {/* Sidebar Configuration Panel */}
        {selectedNodeId && (
          <NodeConfigPanel
            selectedNodeId={selectedNodeId}
            workflowData={workflowData}
            steps={workflowData.steps as WorkflowStep[]}
            registryActions={registryActions}
            onClose={() => setSelectedNodeId(null)}
            onUpdateWorkflow={onUpdateWorkflow}
            onUpdateStep={onUpdateStep}
            onRemoveStep={onRemoveStep}
          />
        )}
      </div>
    </div>
  );
};
