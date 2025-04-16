import type { WorkspaceDocument } from './WorkspaceDocument';

/**
 * Tag view state for VS Code webview
 */

export interface TagViewState {
  documents: WorkspaceDocument[];
  selectedDocument?: WorkspaceDocument;
  selectedTags: string[];
  expandedCategories: string[];
  filterQuery?: string;
}
