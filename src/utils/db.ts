import 'dotenv/config';
import { Temporal } from "@js-temporal/polyfill";
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../generated/prisma/contract';
import contractJson from '../generated/prisma/contract.json' with { type: 'json' };

// This is a workaround for the Temporal polyfill not being recognized in the global scope
globalThis.Temporal = Temporal as unknown as typeof globalThis.Temporal;

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
