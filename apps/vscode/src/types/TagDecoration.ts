/**
 * Tag decoration for VS Code editor
 */

export interface TagDecoration {
  tag: string;
  style: {
    backgroundColor?: string;
    color?: string;
    border?: string;
    borderRadius?: string;
    fontWeight?: string;
  };
  hoverMessage: string;
}
