import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import fs from 'fs-extra';
import { logger } from '../utils/logger';
import { benchmark } from '../utils/benchmark';
import { formatCurrency, formatDuration } from '../mocks/utils';
import type { TestOptions } from '../types/commands';
import type { AIModel } from '@obsidian-magic/types'; 