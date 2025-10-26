<script setup lang="ts">
import { Panel, useVueFlow } from '@vue-flow/core';
import { computed } from 'vue';

import { useGraphSettings } from '../../../stores/graphSettings';


const emit = defineEmits<{
  'relationship-filter-change': [types: string[]];
  'reset-layout': [];
  'layout-change': [config: { direction?: string; nodeSpacing?: number; rankSpacing?: number }];
  'toggle-cluster-folder': [value: boolean];
  'toggle-show-packages': [value: boolean];
  'toggle-show-modules': [value: boolean];
  'toggle-show-classes': [value: boolean];
  'toggle-show-interfaces': [value: boolean];
  'toggle-show-types': [value: boolean];
  'toggle-show-enums': [value: boolean];
  'toggle-show-functions': [value: boolean];
  'node-visibility-change': [];
  'enhanced-layout-change': [];
  'clustering-change': [];
  'visual-hierarchy-change': [];
}>();

const { zoomIn, zoomOut, fitView } = useVueFlow();
const graphSettings = useGraphSettings();

// Layout configuration - use writable computed properties for two-way binding
const layoutDirection = computed(() => graphSettings.layoutDirection);
const nodeSpacing = computed({
  get: () => graphSettings.nodeSpacing,
  set: (value: number) => graphSettings.setNodeSpacing(value),
});
const rankSpacing = computed({
  get: () => graphSettings.rankSpacing,
  set: (value: number) => graphSettings.setRankSpacing(value),
});

// Node type visibility - use computed to reference the store's reactive refs
const showPackages = computed(() => graphSettings.showPackages);
const showModules = computed(() => graphSettings.showModules);
const showClasses = computed(() => graphSettings.showClasses);
const showInterfaces = computed(() => graphSettings.showInterfaces);
const showTypes = computed(() => graphSettings.showTypes);
const showEnums = computed(() => graphSettings.showEnums);
const showFunctions = computed(() => graphSettings.showFunctions);
const clusterByFolder = computed(() => graphSettings.clusterByFolder);

// Relationship filters - use computed to reference the store's reactive refs
const enabledTypes = computed(() => graphSettings.enabledRelationshipTypes);

// Enhanced layout options
const useMultiAlgorithm = computed(() => graphSettings.useMultiAlgorithm);
const layoutStrategy = computed(() => graphSettings.layoutStrategy);
const forceDirectedConfig = computed(() => graphSettings.forceDirectedConfig);

// Smart clustering options
const useSmartClustering = computed(() => graphSettings.useSmartClustering);
const clusteringOptions = computed(() => graphSettings.clusteringOptions);

// Visual hierarchy options
const useVisualHierarchy = computed(() => graphSettings.useVisualHierarchy);
const visualHierarchyConfig = computed(() => graphSettings.visualHierarchyConfig);

const handleZoomIn = () => {
  void zoomIn({ duration: 150 });
};

const handleZoomOut = () => {
  void zoomOut({ duration: 150 });
};

const handleFitView = () => {
  void fitView({ duration: 150, padding: 0.1 });
};

const handleResetLayout = () => {
  emit('reset-layout');
};

// Node types that can be toggled
// Note: Only include leaf/content node types, not containers (package, module, group)
// Packages and modules are controlled by includePackages/includeClasses options

// Relationship types matching the actual edge data types (lowercase)
const relationshipTypes = [
  'import',
  'uses',
  'export',
  'inheritance',
  'implements',
  'contains',
  'dependency',
  'devDependency',
  'peerDependency',
];

const handleFilterChange = (type: string, checked: boolean) => {
  const currentTypes = enabledTypes.value;
  const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);
  graphSettings.setEnabledRelationshipTypes(newTypes);
  emit('relationship-filter-change', newTypes);
};

const handleDirectionChange = (direction: 'LR' | 'RL' | 'TB' | 'BT') => {
  graphSettings.setLayoutDirection(direction);
  emit('layout-change', { direction });
};

const handleSpacingChange = () => {
  // Values are already updated via writable computed setters
  emit('layout-change', {
    nodeSpacing: nodeSpacing.value,
    rankSpacing: rankSpacing.value,
  });
};

const handleShowPackagesToggle = (checked: boolean) => {
  graphSettings.setShowPackages(checked);
  emit('toggle-show-packages', checked);
};

const handleShowModulesToggle = (checked: boolean) => {
  graphSettings.setShowModules(checked);
  emit('toggle-show-modules', checked);
};

const handleShowClassesToggle = (checked: boolean) => {
  graphSettings.setShowClasses(checked);
  emit('toggle-show-classes', checked);
};

const handleShowInterfacesToggle = (checked: boolean) => {
  graphSettings.setShowInterfaces(checked);
  emit('toggle-show-interfaces', checked);
};

const handleShowTypesToggle = (checked: boolean) => {
  graphSettings.setShowTypes(checked);
  emit('toggle-show-types', checked);
};

const handleShowEnumsToggle = (checked: boolean) => {
  graphSettings.setShowEnums(checked);
  emit('toggle-show-enums', checked);
};

const handleShowFunctionsToggle = (checked: boolean) => {
  graphSettings.setShowFunctions(checked);
  emit('toggle-show-functions', checked);
};

const handleClusterByFolderToggle = (checked: boolean) => {
  graphSettings.setClusterByFolder(checked);
  emit('toggle-cluster-folder', checked);
};

// Enhanced layout handlers
const handleUseMultiAlgorithmToggle = (checked: boolean) => {
  graphSettings.setUseMultiAlgorithm(checked);
  emit('enhanced-layout-change');
};

const handleLayoutStrategyChange = (strategy: 'balanced' | 'performance' | 'detailed') => {
  graphSettings.setLayoutStrategy(strategy);
  emit('enhanced-layout-change');
};

const handleForceDirectedConfigChange = (config: {
  iterations: number;
  strength: number;
  distance: number;
  damping: number;
}) => {
  graphSettings.setForceDirectedConfig(config);
  emit('enhanced-layout-change');
};

// Smart clustering handlers
const handleUseSmartClusteringToggle = (checked: boolean) => {
  graphSettings.setUseSmartClustering(checked);
  emit('clustering-change');
};

const handleClusteringOptionsChange = (options: {
  dependencyBased: boolean;
  complexityBased: boolean;
  couplingBased: boolean;
  temporalBased: boolean;
  customMetrics: string[];
}) => {
  graphSettings.setClusteringOptions(options);
  emit('clustering-change');
};

// Visual hierarchy handlers
const handleUseVisualHierarchyToggle = (checked: boolean) => {
  graphSettings.setUseVisualHierarchy(checked);
  emit('visual-hierarchy-change');
};

const handleVisualHierarchyConfigChange = (config: {
  sizeByComplexity: boolean;
  sizeByCoupling: boolean;
  sizeByImportance: boolean;
  colorByComplexity: boolean;
  colorByCoupling: boolean;
  colorByHealth: boolean;
  showComplexityBadge: boolean;
  showCouplingIndicator: boolean;
  showHealthIndicator: boolean;
  showImportanceGlow: boolean;
  sizeMultiplier: number;
  colorIntensity: number;
  indicatorSize: number;
}) => {
  graphSettings.setVisualHierarchyConfig(config);
  emit('visual-hierarchy-change');
};
</script>

<template>
  <Panel position="top-left">
    <div class="bg-background-paper p-4 rounded-lg border border-border-default shadow-xl">
      <!-- Button Group -->
      <div class="flex gap-2 mb-4">
        <button
          @click="handleZoomIn"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default font-semibold"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          @click="handleZoomOut"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default font-semibold"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          @click="handleFitView"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default text-xs font-semibold"
          aria-label="Fit view to content"
        >
          Fit
        </button>
        <button
          @click="handleResetLayout"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default text-xs font-semibold"
          aria-label="Reset layout"
        >
          Reset
        </button>
      </div>

      <!-- Layout Direction (dagre uses hierarchical layout with different flow directions) -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Layout Direction</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="dir in ['LR', 'RL', 'TB', 'BT']"
            :key="dir"
            @click="handleDirectionChange(dir as 'LR' | 'RL' | 'TB' | 'BT')"
            :class="[
              'px-2 py-1.5 text-xs rounded border transition-fast',
              layoutDirection === dir
                ? 'bg-primary-main text-white border-primary-main'
                : 'bg-white/10 text-text-primary border-border-default hover:bg-white/20',
            ]"
            :aria-label="`Set layout direction to ${dir}`"
          >
            {{ dir }}
          </button>
        </div>
      </div>

      <!-- Spacing Controls -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Spacing</h4>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs text-text-secondary block mb-1"> Node Spacing: {{ nodeSpacing }} </label>
            <input
              v-model.number="nodeSpacing"
              type="range"
              min="50"
              max="200"
              step="10"
              @change="handleSpacingChange"
              class="w-full cursor-pointer accent-primary-main"
            />
          </div>
          <div>
            <label class="text-xs text-text-secondary block mb-1"> Rank Spacing: {{ rankSpacing }} </label>
            <input
              v-model.number="rankSpacing"
              type="range"
              min="100"
              max="300"
              step="10"
              @change="handleSpacingChange"
              class="w-full cursor-pointer accent-primary-main"
            />
          </div>
        </div>
      </div>

      <!-- Node Types Control -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Node Types</h4>
        <div class="flex flex-col gap-2">
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showPackages"
              @change="(e) => handleShowPackagesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Package</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showModules"
              @change="(e) => handleShowModulesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Module</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showClasses"
              @change="(e) => handleShowClassesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Class</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showInterfaces"
              @change="(e) => handleShowInterfacesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Interface</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showTypes"
              @change="(e) => handleShowTypesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Type</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showEnums"
              @change="(e) => handleShowEnumsToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Enum</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showFunctions"
              @change="(e) => handleShowFunctionsToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Function</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="clusterByFolder"
              @change="(e) => handleClusterByFolderToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Group by folder</span>
          </label>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Relationship Types</h4>
        <div class="flex flex-col gap-1.5">
          <label
            v-for="type in relationshipTypes"
            :key="type"
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="enabledTypes.includes(type)"
              @change="(e) => handleFilterChange(type, (e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs capitalize">{{ type }}</span>
          </label>
        </div>
      </div>

      <!-- Enhanced Layout Options -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Enhanced Layout</h4>
        <div class="flex flex-col gap-2">
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="useMultiAlgorithm"
              @change="(e) => handleUseMultiAlgorithmToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Use Multi-Algorithm Layout</span>
          </label>

          <div v-if="useMultiAlgorithm" class="ml-4 space-y-2">
            <div>
              <label class="text-xs text-text-secondary block mb-1">Strategy</label>
              <select
                :value="layoutStrategy"
                @change="
                  (e) =>
                    handleLayoutStrategyChange(
                      (e.target as HTMLSelectElement).value as 'balanced' | 'performance' | 'detailed'
                    )
                "
                class="w-full text-xs bg-white/10 border border-border-default rounded px-2 py-1 text-text-primary"
              >
                <option value="balanced">Balanced</option>
                <option value="performance">Performance</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-text-secondary block mb-1"
                >Force Directed - Iterations: {{ forceDirectedConfig.iterations }}</label
              >
              <input
                type="range"
                :value="forceDirectedConfig.iterations"
                min="50"
                max="200"
                step="10"
                @input="
                  (e) =>
                    handleForceDirectedConfigChange({
                      ...forceDirectedConfig,
                      iterations: Number((e.target as HTMLInputElement).value),
                    })
                "
                class="w-full cursor-pointer accent-primary-main"
              />
            </div>

            <div>
              <label class="text-xs text-text-secondary block mb-1"
                >Force Directed - Strength: {{ forceDirectedConfig.strength.toFixed(2) }}</label
              >
              <input
                type="range"
                :value="forceDirectedConfig.strength"
                min="0.01"
                max="0.5"
                step="0.01"
                @input="
                  (e) =>
                    handleForceDirectedConfigChange({
                      ...forceDirectedConfig,
                      strength: Number((e.target as HTMLInputElement).value),
                    })
                "
                class="w-full cursor-pointer accent-primary-main"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Smart Clustering Options -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Smart Clustering</h4>
        <div class="flex flex-col gap-2">
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="useSmartClustering"
              @change="(e) => handleUseSmartClusteringToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Enable Smart Clustering</span>
          </label>

          <div v-if="useSmartClustering" class="ml-4 space-y-1">
            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="clusteringOptions.dependencyBased"
                @change="
                  (e) =>
                    handleClusteringOptionsChange({
                      ...clusteringOptions,
                      dependencyBased: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Dependency-based</span>
            </label>

            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="clusteringOptions.complexityBased"
                @change="
                  (e) =>
                    handleClusteringOptionsChange({
                      ...clusteringOptions,
                      complexityBased: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Complexity-based</span>
            </label>

            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="clusteringOptions.couplingBased"
                @change="
                  (e) =>
                    handleClusteringOptionsChange({
                      ...clusteringOptions,
                      couplingBased: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Coupling-based</span>
            </label>

            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="clusteringOptions.temporalBased"
                @change="
                  (e) =>
                    handleClusteringOptionsChange({
                      ...clusteringOptions,
                      temporalBased: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Temporal-based</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Visual Hierarchy Options -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Visual Hierarchy</h4>
        <div class="flex flex-col gap-2">
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="useVisualHierarchy"
              @change="(e) => handleUseVisualHierarchyToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Enable Visual Hierarchy</span>
          </label>

          <div v-if="useVisualHierarchy" class="ml-4 space-y-1">
            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="visualHierarchyConfig.sizeByComplexity"
                @change="
                  (e) =>
                    handleVisualHierarchyConfigChange({
                      ...visualHierarchyConfig,
                      sizeByComplexity: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Size by complexity</span>
            </label>

            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="visualHierarchyConfig.colorByComplexity"
                @change="
                  (e) =>
                    handleVisualHierarchyConfigChange({
                      ...visualHierarchyConfig,
                      colorByComplexity: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Color by complexity</span>
            </label>

            <label
              class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
            >
              <input
                type="checkbox"
                :checked="visualHierarchyConfig.showComplexityBadge"
                @change="
                  (e) =>
                    handleVisualHierarchyConfigChange({
                      ...visualHierarchyConfig,
                      showComplexityBadge: (e.target as HTMLInputElement).checked,
                    })
                "
                class="cursor-pointer accent-primary-main"
              />
              <span class="text-xs">Show complexity badge</span>
            </label>

            <div>
              <label class="text-xs text-text-secondary block mb-1"
                >Size Multiplier: {{ visualHierarchyConfig.sizeMultiplier.toFixed(1) }}</label
              >
              <input
                type="range"
                :value="visualHierarchyConfig.sizeMultiplier"
                min="0.5"
                max="2.0"
                step="0.1"
                @input="
                  (e) =>
                    handleVisualHierarchyConfigChange({
                      ...visualHierarchyConfig,
                      sizeMultiplier: Number((e.target as HTMLInputElement).value),
                    })
                "
                class="w-full cursor-pointer accent-primary-main"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Panel>
</template>
