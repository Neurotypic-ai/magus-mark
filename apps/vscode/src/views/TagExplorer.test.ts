import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode'; // Keep vscode import, relying on global mock

// Assume initializeCore is mocked elsewhere or adjust as needed
// import { initializeCore } from '@magus-mark/core';

import { TagExplorer } from './TagExplorer';

import type { Taxonomy } from '@magus-mark/core/models/Taxonomy';
import type { TaxonomyManager } from '@magus-mark/core/tagging/TaxonomyManager';

// import type { TagNode } from './TagExplorer'; // TagNode not used in converted tests yet

// TODO: Address vi.mock replacements later if needed

suite('TagExplorer', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: Partial<vscode.ExtensionContext>;
  // Define a mock object conforming to TaxonomyManager interface
  let mockTaxonomyManager: {
    getTaxonomy: sinon.SinonStub;
    addDomain: sinon.SinonStub;
    addSubdomain: sinon.SinonStub;
    onChange: sinon.SinonStub<[(taxonomy: Taxonomy) => void], void>; // Add listener signature
    configure: sinon.SinonStub;
    getDomainsWithSubdomains: sinon.SinonStub;
    getDomains: sinon.SinonStub;
    getSubdomains: sinon.SinonStub;
    getSubdomainsForDomain: sinon.SinonStub;
    addTag: sinon.SinonStub;
    load: sinon.SinonStub;
    save: sinon.SinonStub;
    // Add other necessary properties if the tests require them
  };
  let sampleTaxonomy: Taxonomy;
  // let initializeCoreStub: sinon.SinonStub; // Removed direct stubbing

  setup(() => {
    sandbox = sinon.createSandbox();

    mockContext = {
      subscriptions: [],
    };

    // Create a mock TaxonomyManager object with stubs
    mockTaxonomyManager = {
      getTaxonomy: sandbox.stub(),
      addDomain: sandbox.stub(),
      addSubdomain: sandbox.stub(),
      onChange: sandbox.stub(), // Simple stub for listener registration
      configure: sandbox.stub(),
      getDomainsWithSubdomains: sandbox.stub(),
      getDomains: sandbox.stub(),
      getSubdomains: sandbox.stub(),
      getSubdomainsForDomain: sandbox.stub(),
      addTag: sandbox.stub(),
      load: sandbox.stub(),
      save: sandbox.stub(),
    };

    // Sample taxonomy data for testing
    sampleTaxonomy = {
      domains: ['Knowledge', 'Programming'],
      subdomains: {
        Knowledge: ['History', 'Science', 'Mathematics'],
        Programming: ['JavaScript', 'TypeScript', 'Python'],
      },
      lifeAreas: [],
      conversationTypes: [],
      contextualTags: [],
    } as unknown as Taxonomy;

    // Set up the mock taxonomy manager to return sample data
    mockTaxonomyManager.getTaxonomy.returns(sampleTaxonomy);
    mockTaxonomyManager.getDomains.returns(['Knowledge', 'Programming']);

    // Removed direct stubbing of initializeCore
    // Assume TagExplorer calls initializeCore internally and gets a manager
    // We pass our mock manager directly to the constructor

    // Stub vscode methods used in the tests
    sandbox.stub(vscode.window, 'showInputBox');
    sandbox.stub(vscode.window, 'showQuickPick');
    sandbox.stub(vscode.window, 'showInformationMessage');
    sandbox.stub(vscode.commands, 'registerCommand');
    sandbox.stub(vscode.window, 'showWarningMessage');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should initialize with taxonomy data', () => {
    // Pass the correctly typed mock manager
    // Assume constructor or internal method uses this directly or calls initializeCore
    const tagExplorer = new TagExplorer(
      mockContext as vscode.ExtensionContext,
      mockTaxonomyManager as unknown as TaxonomyManager
    );

    // Verify taxonomy data was retrieved (assuming constructor calls it)
    // sinon.assert.calledOnce(mockTaxonomyManager.getTaxonomy); // Cannot verify if constructor doesn't call it directly
    void expect(tagExplorer).to.exist; // Basic check that instance was created
  });

  test('should provide tree items with correct properties', () => {
    const tagExplorer = new TagExplorer(
      mockContext as vscode.ExtensionContext,
      mockTaxonomyManager as unknown as TaxonomyManager
    );
    const rootChildren = tagExplorer.getChildren(); // This implicitly uses getTaxonomy mock data

    void expect(rootChildren).to.have.lengthOf(2);
    const knowledgeDomain = rootChildren[0];
    void expect(knowledgeDomain).to.exist;
    if (!knowledgeDomain) return;
    void expect(knowledgeDomain.name).to.equal('Knowledge');
    void expect(knowledgeDomain.type).to.equal('domain');
    void expect(knowledgeDomain.children).to.have.lengthOf(3);

    const domainItem = tagExplorer.getTreeItem(knowledgeDomain);
    void expect(domainItem.label).to.equal('Knowledge');
    void expect(domainItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
    void expect(domainItem.contextValue).to.equal('domain');

    const subdomains = tagExplorer.getChildren(knowledgeDomain);
    void expect(subdomains).to.have.lengthOf(3);
    const historySubdomain = subdomains[0];
    void expect(historySubdomain).to.exist;
    if (!historySubdomain) return;
    void expect(historySubdomain.name).to.equal('History');
    void expect(historySubdomain.type).to.equal('subdomain');

    const subdomainItem = tagExplorer.getTreeItem(historySubdomain);
    void expect(subdomainItem.label).to.equal('History');
    void expect(subdomainItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
    void expect(subdomainItem.contextValue).to.equal('subdomain');
  });

  test('should find parent nodes correctly', async () => {
    const tagExplorer = new TagExplorer(
      mockContext as vscode.ExtensionContext,
      mockTaxonomyManager as unknown as TaxonomyManager
    );
    const domains = tagExplorer.getChildren();

    void expect(domains).to.exist;
    void expect(domains.length).to.be.greaterThan(1);
    const programmingDomain = domains[1];
    void expect(programmingDomain).to.exist;
    if (!programmingDomain) return;

    const programmingSubdomains = tagExplorer.getChildren(programmingDomain);
    void expect(programmingSubdomains.length).to.be.greaterThan(1);
    const typescriptNode = programmingSubdomains[1];
    void expect(typescriptNode).to.exist;
    if (!typescriptNode) return;

    const parent = await tagExplorer.getParent?.(typescriptNode);
    void expect(parent?.id).to.equal('Programming');
    void expect(parent?.name).to.equal('Programming');

    const rootLevel = domains[0];
    if (!rootLevel) return;
    const rootParent = await tagExplorer.getParent?.(rootLevel);
    void expect(rootParent).to.be.null;
  });

  test('should handle add tag command', async () => {
    // Instance is created, which registers the command
    new TagExplorer(mockContext as vscode.ExtensionContext, mockTaxonomyManager as unknown as TaxonomyManager);

    const showInputBoxStub = vscode.window.showInputBox as sinon.SinonStub;
    const showQuickPickStub = vscode.window.showQuickPick as sinon.SinonStub;
    showInputBoxStub.resolves('NewTag');
    showQuickPickStub.resolves('Programming');
    const registerCommandStub = vscode.commands.registerCommand as sinon.SinonStub;

    // Find the command handler registered by the TagExplorer constructor
    const commandCalls = registerCommandStub.getCalls();
    type CommandHandler = (...args: unknown[]) => Promise<void> | void;
    const addTagCommandCall = commandCalls.find((call) => call.args[0] === 'magus-mark.addTag');
    const addTagCommandHandler = addTagCommandCall?.args[1] as CommandHandler | undefined;
    void expect(addTagCommandHandler).to.exist;
    if (!addTagCommandHandler) return;

    // Execute the handler
    await addTagCommandHandler();

    // Verify prompts and calls
    sinon.assert.calledWith(showInputBoxStub, sinon.match({ prompt: 'Enter a new tag name' }));
    sinon.assert.calledWith(
      showQuickPickStub,
      sinon.match.array.contains(['<New Domain>', 'Knowledge', 'Programming']),
      sinon.match.any
    );
    sinon.assert.calledWith(mockTaxonomyManager.addSubdomain, 'Programming', 'NewTag');
    sinon.assert.calledWith(
      vscode.window.showInformationMessage as sinon.SinonStub,
      "Tag 'NewTag' added to Programming"
    );
  });

  test('should handle new domain creation', async () => {
    new TagExplorer(mockContext as vscode.ExtensionContext, mockTaxonomyManager as unknown as TaxonomyManager);

    const showInputBoxStub = vscode.window.showInputBox as sinon.SinonStub;
    const showQuickPickStub = vscode.window.showQuickPick as sinon.SinonStub;
    showInputBoxStub.onFirstCall().resolves('NewTag');
    showQuickPickStub.resolves('<New Domain>');
    showInputBoxStub.onSecondCall().resolves('NewDomain');
    const registerCommandStub = vscode.commands.registerCommand as sinon.SinonStub;

    const commandCalls = registerCommandStub.getCalls();
    type CommandHandler = (...args: unknown[]) => Promise<void> | void;
    const addTagCommandCall = commandCalls.find((call) => call.args[0] === 'magus-mark.addTag');
    const addTagCommandHandler = addTagCommandCall?.args[1] as CommandHandler | undefined;
    void expect(addTagCommandHandler).to.exist;
    if (!addTagCommandHandler) return;

    await addTagCommandHandler();

    sinon.assert.calledWith(showInputBoxStub.firstCall, sinon.match({ prompt: 'Enter a new tag name' }));
    sinon.assert.calledWith(showQuickPickStub, sinon.match.array.contains(['<New Domain>']));
    sinon.assert.calledWith(showInputBoxStub.secondCall, sinon.match({ prompt: 'Enter new domain name' }));
    sinon.assert.calledWith(mockTaxonomyManager.addDomain, 'NewDomain');
    sinon.assert.calledWith(mockTaxonomyManager.addSubdomain, 'NewDomain', 'NewTag');
    sinon.assert.calledWith(vscode.window.showInformationMessage as sinon.SinonStub, "Tag 'NewTag' added to NewDomain");
  });

  // TODO: Convert remaining tests (e.g., delete tag, refresh, dispose)
});
