import { Box, Typography } from '@mui/material';

import { nodeDetailsStyles } from '../../../theme/graphTheme';

import type { Node } from '@xyflow/react';

import type { DependencyData } from '../types';

interface NodeDetailsProps {
  node: Node<DependencyData>;
}

const NodeDetails = ({ node }: NodeDetailsProps) => {
  return (
    <Box sx={nodeDetailsStyles.container}>
      <Typography variant="h6" sx={nodeDetailsStyles.title}>
        {node.data.label}
      </Typography>
      <Typography variant="body2" sx={nodeDetailsStyles.typeLabel}>
        Type: {node.type}
      </Typography>

      {node.data.properties && node.data.properties.length > 0 ? (
        <Box sx={nodeDetailsStyles.sectionContainer}>
          <Typography variant="subtitle2" component="strong">
            Properties:
          </Typography>
          {node.data.properties.map((prop) => (
            <Box key={prop.name} sx={nodeDetailsStyles.itemContainer}>
              {prop.name}: {prop.type}
            </Box>
          ))}
        </Box>
      ) : null}

      {node.data.methods && node.data.methods.length > 0 ? (
        <Box sx={nodeDetailsStyles.sectionContainer}>
          <Typography variant="subtitle2" component="strong">
            Methods:
          </Typography>
          {node.data.methods.map((method) => (
            <Box key={method.name} sx={nodeDetailsStyles.itemContainer}>
              {method.name}(): {method.returnType}
            </Box>
          ))}
        </Box>
      ) : null}

      {node.data.imports && node.data.imports.length > 0 ? (
        <Box sx={nodeDetailsStyles.sectionContainer}>
          <Typography variant="subtitle2" component="strong">
            Imports:
          </Typography>
          {node.data.imports.map((imp, index) => (
            <Box key={index} sx={nodeDetailsStyles.itemContainer}>
              {imp}
            </Box>
          ))}
        </Box>
      ) : null}

      {node.data.exports && node.data.exports.length > 0 ? (
        <Box sx={nodeDetailsStyles.sectionContainer}>
          <Typography variant="subtitle2" component="strong">
            Exports:
          </Typography>
          {node.data.exports.map((exp, index) => (
            <Box key={index} sx={nodeDetailsStyles.itemContainer}>
              {exp}
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default NodeDetails;
