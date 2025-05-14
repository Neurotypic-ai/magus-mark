import { memo, useCallback } from 'react';

import { styled, useTheme } from '@mui/material/styles';
import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';

import { graphTheme } from '../../../theme/graphTheme';

import type { Theme } from '@mui/material/styles';
import type { NamedExoticComponent } from 'react';

import type { DependencyProps, NodeMethod, NodeProperty } from '../types';

const NodeContainer = styled('div')<{ selected: boolean; type: string }>(
  ({ theme, selected, type }: { theme: Theme; selected: boolean; type: string }) => ({
    padding: `${String(graphTheme.nodes.padding.header)}px ${String(graphTheme.nodes.padding.content)}px`,
    borderRadius: graphTheme.nodes.borderRadius,
    backgroundColor: graphTheme.nodes.colors.background.default,
    border: `1px solid ${selected ? theme.palette.primary.main : graphTheme.nodes.colors.border}`,
    minWidth: graphTheme.nodes.minDimensions.width,
    minHeight: graphTheme.nodes.minDimensions.height,
    boxShadow: selected ? `0 0 0 1px rgba(144, 202, 249, 0.5)` : 'none',
    fontSize: type === 'package' ? '14px' : '12px',
    position: 'relative',
    cursor: 'move',
    zIndex: type === 'package' ? 5 : 1,
    color: theme.palette.common.white,
    transition: 'all 0.2s ease',
    width: 'auto',
    height: 'auto',
    '&:hover': {
      backgroundColor: graphTheme.nodes.colors.background.package,
      border: `1px solid ${selected ? theme.palette.primary.main : graphTheme.nodes.colors.border}`,
    },
  })
);

const NodeHeader = styled('div')(({ theme }: { theme: Theme }) => ({
  marginBottom: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  borderBottom: `1px solid ${graphTheme.nodes.colors.border}`,
  paddingBottom: theme.spacing(0.5),
}));

const NodeTitle = styled('div')<{ type: string }>(({ theme, type }: { theme: Theme; type: string }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontSize: type === 'package' ? '14px' : '12px',
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const NodeType = styled('div')(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(0.5, 1),
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: graphTheme.nodes.borderRadius,
  color: theme.palette.text.secondary,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const NodeContent = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  maxHeight: 120,
  overflowY: 'auto',
}));

const NodeSection = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  padding: theme.spacing(0.5),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: graphTheme.nodes.borderRadius,
}));

const SectionTitle = styled('div')(({ theme }: { theme: Theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  marginBottom: theme.spacing(0.25),
}));

const ItemRow = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.primary,
  fontSize: '12px',
  padding: theme.spacing(0.25),
  borderRadius: graphTheme.nodes.borderRadius,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const Visibility = styled('span')<{ visibility: string }>(
  ({ theme, visibility }: { theme: Theme; visibility: string }) => ({
    width: graphTheme.nodes.padding.content / 4,
    height: graphTheme.nodes.padding.content / 4,
    borderRadius: '50%',
    backgroundColor:
      visibility === 'public'
        ? theme.palette.success.main
        : visibility === 'protected'
          ? theme.palette.warning.main
          : theme.palette.error.main,
  })
);

/**
 * Dependency Node Component - displays a node in the dependency graph
 */
const DependencyNode: NamedExoticComponent<DependencyProps> = memo(function DependencyNode({
  id,
  data,
  selected,
  type,
}: DependencyProps): React.ReactElement {
  const { setNodes } = useReactFlow();
  const muiTheme = useTheme();

  // Make sure data exists and has the required properties
  const nodeData = data;
  const nodeType = type;
  const isSelected = !!selected;

  // Safe debug logging with type checks
  console.info('DependencyNode data:', {
    id,
    type: nodeType,
    properties: nodeData.properties ?? [],
    methods: nodeData.methods ?? [],
  });

  // Handler for node resizing
  const updateNodeDimensions = useCallback(
    (_: unknown, { width, height }: { width: number; height: number }) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              measured: { width, height },
            };
          }
          return node;
        })
      );
    },
    [id, setNodes]
  );

  return (
    <>
      <NodeResizer
        isVisible={isSelected}
        minWidth={graphTheme.nodes.minDimensions.width}
        minHeight={graphTheme.nodes.minDimensions.height}
        handleStyle={{ backgroundColor: muiTheme.palette.primary.main }}
        lineStyle={{ border: `1px solid ${muiTheme.palette.primary.main}` }}
        onResize={updateNodeDimensions}
      />
      <NodeContainer selected={isSelected} type={nodeType}>
        <Handle type="target" position={Position.Top} />
        <NodeHeader>
          <NodeTitle type={nodeType}>{nodeData.label || 'Unnamed'}</NodeTitle>
          <NodeType>{nodeType}</NodeType>
        </NodeHeader>
        <NodeContent>
          {nodeData.properties && nodeData.properties.length > 0 ? (
            <NodeSection>
              <SectionTitle>Properties</SectionTitle>
              {nodeData.properties.map((prop: NodeProperty, index: number) => (
                <ItemRow key={index}>
                  {prop.visibility ? <Visibility visibility={prop.visibility} /> : null}
                  <span>
                    {prop.name}: {prop.type}
                  </span>
                </ItemRow>
              ))}
            </NodeSection>
          ) : null}
          {nodeData.methods && nodeData.methods.length > 0 ? (
            <NodeSection>
              <SectionTitle>Methods</SectionTitle>
              {nodeData.methods.map((method: NodeMethod, index: number) => (
                <ItemRow key={index}>
                  {method.visibility ? <Visibility visibility={method.visibility} /> : null}
                  <span>
                    {method.name}(): {method.returnType}
                  </span>
                </ItemRow>
              ))}
            </NodeSection>
          ) : null}
        </NodeContent>
        <Handle type="source" position={Position.Bottom} />
      </NodeContainer>
    </>
  );
});

DependencyNode.displayName = 'DependencyNode';

export default DependencyNode;
