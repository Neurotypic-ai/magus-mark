import { expect } from 'chai';
import { setup, teardown, test } from 'mocha';
import * as sinon from 'sinon';

import { TagExplorerProvider } from './TagExplorer';

import type { VaultIntegrationService } from '../services/VaultIntegrationService';

suite('TagExplorerProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let mockVaultService: Partial<VaultIntegrationService>;

  setup(() => {
    sandbox = sinon.createSandbox();

    // Create a mock vault service
    mockVaultService = {
      getVaults: sandbox.stub().returns([]),
      onVaultChanged: sandbox.stub().returns({ dispose: sandbox.stub() }),
      onFileSynced: sandbox.stub().returns({ dispose: sandbox.stub() }),
    };
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should initialize without vault service', () => {
    const provider = new TagExplorerProvider();

    expect(provider).to.be.instanceOf(TagExplorerProvider);
  });

  test('should initialize with vault service', () => {
    const provider = new TagExplorerProvider(mockVaultService as VaultIntegrationService);

    expect(provider).to.be.instanceOf(TagExplorerProvider);
    sinon.assert.called(mockVaultService.onVaultChanged as sinon.SinonStub);
    sinon.assert.called(mockVaultService.onFileSynced as sinon.SinonStub);
  });

  test('should return empty tags when no vault service', async () => {
    const provider = new TagExplorerProvider();

    const children = await provider.getChildren();

    expect(children).to.be.an('array');
    expect(children).to.have.lengthOf(1);
    expect(children[0]?.contextValue).to.equal('info');
  });

  test('should return no vaults message when vault service has no vaults', async () => {
    (mockVaultService.getVaults as sinon.SinonStub).returns([]);

    const provider = new TagExplorerProvider(mockVaultService as VaultIntegrationService);

    const children = await provider.getChildren();

    expect(children).to.be.an('array');
    expect(children).to.have.lengthOf(1);
    expect(children[0]?.contextValue).to.equal('info');
  });

  test('should create tree items correctly', () => {
    const provider = new TagExplorerProvider();

    const mockTagItem = {
      id: 'test-tag',
      label: 'Test Tag',
      tooltip: 'Test tooltip',
      contextValue: 'tag',
      usage: 5,
    };

    const treeItem = provider.getTreeItem(mockTagItem);

    expect(treeItem.label).to.equal('Test Tag');
    expect(treeItem.tooltip).to.equal('Test tooltip');
    expect(treeItem.contextValue).to.equal('tag');
    expect(treeItem.description).to.equal('(5)');
  });
});
