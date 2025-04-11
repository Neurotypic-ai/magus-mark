import { z } from 'zod';

export const ApiModelSchema = z.enum([
  // O1 Family (Newest)
  'o1',
  'o1-mini',
  'o1-preview',
  // O3 Family (Newest)
  'o3',
  'o3-mini',
  // GPT-4 Family
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4-vision',
  // GPT-3.5 Family
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-instruct',
  // Base Models
  'davinci-002',
  'babbage-002',
]);
