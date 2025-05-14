import { useCallback } from 'react';

import { Box, Button } from '@mui/material';
import { Panel, useReactFlow } from '@xyflow/react';

import { graphControlsStyles } from '../../../theme/graphTheme';

import type { JSX } from 'react';

interface GraphControlsProps {
  onRelationshipFilterChange?: (types: string[]) => void;
  onResetLayout?: () => void;
}

export function GraphControls({ onRelationshipFilterChange, onResetLayout }: GraphControlsProps): JSX.Element {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    void zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    void zoomOut({ duration: 300 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    void fitView({ duration: 300 });
  }, [fitView]);

  const handleResetLayout = useCallback(() => {
    onResetLayout?.();
  }, [onResetLayout]);

  const relationshipTypes = ['IMPORTS', 'EXPORTS', 'EXTENDS', 'IMPLEMENTS', 'CONTAINS', 'USES', 'REFERENCES'];

  return (
    <Panel position="top-left">
      <Box sx={graphControlsStyles.controlsContainer}>
        <Box sx={graphControlsStyles.buttonGroup}>
          <Button variant="outlined" size="small" onClick={handleZoomIn} sx={graphControlsStyles.button}>
            +
          </Button>
          <Button variant="outlined" size="small" onClick={handleZoomOut} sx={graphControlsStyles.button}>
            -
          </Button>
          <Button variant="outlined" size="small" onClick={handleFitView} sx={graphControlsStyles.button}>
            Fit
          </Button>
          <Button variant="outlined" size="small" onClick={handleResetLayout} sx={graphControlsStyles.button}>
            Reset Layout
          </Button>
        </Box>

        <Box sx={graphControlsStyles.filterPanel}>
          <Box component="h4" sx={graphControlsStyles.filterTitle}>
            Relationship Types
          </Box>
          <Box sx={graphControlsStyles.filterContainer}>
            {relationshipTypes.map((type) => (
              <Box component="label" key={type} sx={graphControlsStyles.filterLabel}>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onRelationshipFilterChange?.(
                      checked ? [...relationshipTypes] : relationshipTypes.filter((t) => t !== type)
                    );
                  }}
                />
                {type}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Panel>
  );
}
