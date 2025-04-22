import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Events } from './MockEvents';

import type {
  BaseComponent,
  ButtonComponent,
  ColorComponent,
  DropdownComponent,
  ExtraButtonComponent,
  MomentFormatComponent,
  ProgressBarComponent,
  SearchComponent,
  Setting as SettingType,
  SliderComponent,
  TextAreaComponent,
  TextComponent,
  ToggleComponent,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

const sharedOptions = {
  disabled: false,
  then: vi.fn(),
  onChange: vi.fn(),
  setDisabled: vi.fn(),
  registerOptionListener: vi.fn(),
};

const valueOptions = {
  getValue: vi.fn(),
  setValue: vi.fn(),
};

const clickableOptions = {
  onClick: vi.fn(),
};

const buttonOptions = {
  setButtonText: vi.fn(),
  setClass: vi.fn(),
  setCta: vi.fn(),
  setIcon: vi.fn(),
  setTooltip: vi.fn(),
  removeCta: vi.fn(),
  setWarning: vi.fn(),
};

const extraButtonOptions = {
  setDisabled: vi.fn(),
  setTooltip: vi.fn(),
  setIcon: vi.fn(),
  onClick: vi.fn(),
};

export class Setting extends Events implements SettingType {
  settingEl: MockObsidianElement<'div'>;
  nameEl: MockObsidianElement<'div'>;
  descEl: MockObsidianElement<'div'>;
  controlEl: MockObsidianElement<'div'>;
  infoEl: MockObsidianElement<'div'>;
  components: BaseComponent[] = [];

  constructor(containerEl: MockObsidianElement | HTMLElement) {
    super();

    // All children created via .createEl are MockObsidianElement by contract
    this.settingEl = createMockObsidianElement<'div'>('div', { cls: 'setting-item' });
    const nameAndDescContainer = this.settingEl.createEl('div', { cls: 'setting-item-info' });
    const nameEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-name' });
    const descEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-description' });
    const controlEl = this.settingEl.createEl('div', { cls: 'setting-item-control' });
    const infoEl = this.settingEl.createEl('div', { cls: 'setting-item-info' });
    this.nameEl = nameEl;
    this.descEl = descEl;
    this.controlEl = controlEl;
    this.infoEl = infoEl;
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string): this {
    this.nameEl.setText(name);
    return this;
  }
  setDesc(desc: string | DocumentFragment): this {
    this.descEl.setText(typeof desc === 'string' ? desc : (desc.textContent ?? ''));
    return this;
  }
  setClass(cls: string): this {
    this.settingEl.addClass(cls);
    return this;
  }
  addText(cb: (text: TextComponent) => void): this {
    const el = createMockObsidianElement<'input'>('input', { type: 'text' });
    this.controlEl.appendChild(el);
    const component: TextComponent = {
      ...sharedOptions,
      ...valueOptions,
      inputEl: el,
      onChanged: vi.fn(() => {
        /* void */
      }),
      setPlaceholder: vi.fn(() => component),
      then: vi.fn(() => component),
    };
    this.components.push(component);
    cb(component);
    return this;
  }
  addSearch(cb: (search: SearchComponent) => void): this {
    const el = createMockObsidianElement<'input'>('input', { type: 'search' });
    const clearButton = createMockObsidianElement<'div'>('div', { cls: 'search-clear-button' });
    this.controlEl.appendChild(el);
    this.controlEl.appendChild(clearButton);
    const component: SearchComponent = {
      ...sharedOptions,
      ...valueOptions,
      inputEl: el,
      clearButtonEl: clearButton,
      onChanged: vi.fn(() => {
        /* void */
      }),
      setPlaceholder: vi.fn(() => component),
      then: vi.fn(() => component),
    };
    this.components.push(component);
    cb(component);
    return this;
  }
  addToggle(cb: (toggle: ToggleComponent) => void): this {
    const el = createMockObsidianElement<'input'>('input', { type: 'checkbox' });
    this.controlEl.appendChild(el);
    const component: ToggleComponent = {
      ...sharedOptions,
      ...valueOptions,
      ...clickableOptions,
      toggleEl: el,
      setTooltip: vi.fn(() => component),
      then: vi.fn(() => component),
    };
    this.components.push(component);
    cb(component);
    return this;
  }
  addButton(cb: (button: ButtonComponent) => void): this {
    const el = createMockObsidianElement<'button'>('button');
    this.controlEl.appendChild(el);
    const component: ButtonComponent = {
      ...sharedOptions,
      ...clickableOptions,
      ...buttonOptions,
      buttonEl: el,
      setWarning: vi.fn(() => component),
      then: vi.fn(() => component),
    };
    this.components.push(component);
    cb(component);
    return this;
  }
  addDropdown(cb: (dropdown: DropdownComponent) => void): this {
    const el = createMockObsidianElement<'select'>('select');
    this.controlEl.appendChild(el);
    const component: DropdownComponent = {
      ...sharedOptions,
      ...valueOptions,
      selectEl: el,
      addOption: vi.fn(() => component),
      addOptions: vi.fn(() => component),
      then: vi.fn(() => component),
    };
    this.components.push(component);
    cb(component);
    return this;
  }
  setHeading(): this {
    this.infoEl.setText('Heading');
    return this;
  }
  setInfo(info: string): this {
    this.infoEl.setText(info);
    return this;
  }
  setTooltip(tooltip: string): this {
    this.settingEl.setAttr('title', tooltip);
    return this;
  }
  addExtraButton(cb: (button: ExtraButtonComponent) => void): this {
    const el = createMockObsidianElement<'button'>('button');
    this.controlEl.appendChild(el);
    const component: ExtraButtonComponent = {
      ...sharedOptions,
      ...extraButtonOptions,
      extraSettingsEl: el,
      then: vi.fn(() => component),
    };
    this.components.push(component);
    cb(component);
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setDisabled: (disabled: boolean) => this = vi.fn((_disabled: boolean): this => this);

  addTextArea: (cb: (textArea: TextAreaComponent) => void) => this = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_cb: (textArea: TextAreaComponent) => void): this => this
  );

  addMomentFormat: (cb: (momentFormat: MomentFormatComponent) => void) => this = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_cb: (momentFormat: MomentFormatComponent) => void): this => this
  );

  addSlider: (cb: (slider: SliderComponent) => void) => this = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_cb: (slider: SliderComponent) => void): this => this
  );

  addColorPicker: (cb: (colorPicker: ColorComponent) => void) => this = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_cb: (colorPicker: ColorComponent) => void): this => this
  );

  addProgressBar: (cb: (progressBar: ProgressBarComponent) => void) => this = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_cb: (progressBar: ProgressBarComponent) => void): this => this
  );

  clear: () => this = vi.fn((): this => this);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then: (cb: (setting: this) => any) => this = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_cb: (setting: this) => unknown): this => this
  );
}
