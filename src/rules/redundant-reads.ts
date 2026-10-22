import type { Rule } from './types.js';
import { READ_FREE_CALLS, REDUNDANT_READS_MIN_CALLS, REDUNDANT_READS_MIN_SHARE } from '../metrics.js';
import { fmtTokens } from '../fmt.js';

const rule: Rule = {
  key: 'redundant-reads',
  metric: 'redundantReadShare',
  direction: 'down',
  valuePerPoint: ({ m, rates }) => m.spendTokens * rates.spend,
  family: 'caching',
  title: 'Re-reading what is already in context',
  docs: `Spend on main-loop exploration turns that invoke a read-class tool
(Read, Grep, Glob, WebFetch and friends) past ${READ_FREE_CALLS} uses of that same tool in one
session. Past the first few calls the answer was already on screen, so each
further invocation pays full context to look at it again: the cheapest kind of
waste to fix, and one of the most common.

It is a proxy, and it says so wherever it reports. Transcripts keep tool NAMES
but not their arguments, so one file re-read ten times and ten different files
read through the same tool are indistinguishable here. That is why the bar sits
high: ${(REDUNDANT_READS_MIN_SHARE * 100).toFixed(0)}% of spend AND ${REDUNDANT_READS_MIN_CALLS} repeat calls deep, a place ordinary broad
reading never reaches.

Main loop only, exploration turns only: heavy unbroken reading is a subagent's
job (see search-loop), and a turn that edited alongside its lookups is priced
by its work instead. Repetition interleaved with real work, the digging
search-loop's unbroken-run shape cannot see, lands here. Savings stay
conservative: each carrying turn is priced by the fraction of its tool calls
that were paid repeats, so the free reads and any other work in the same turn
are never counted, and no turn can contribute more than its own spend.`,
  fires: (m) =>
    m.redundantReadShare >= REDUNDANT_READS_MIN_SHARE && m.redundantReadCalls >= REDUNDANT_READS_MIN_CALLS
      ? `${(m.redundantReadShare * 100).toFixed(0)}% of spend goes to turns repeating a read-class tool past its first few results (${m.redundantReadCalls} repeat call(s) across ${m.redundantReadSessions} session(s)): ${fmtTokens(m.redundantReadTokens)}. Tool arguments are not stored, so this is a proxy for re-reading what was already on screen. Keep the files you already have in view and ask for diffs or narrow ranges instead of full re-reads.`
      : undefined,
  score: (s) => ({
    score: s.m.redundantReadTokens,
    label: `${s.m.redundantReadCalls} repeat read call(s)`,
  }),
  savings: ({ m, rates }) => m.redundantReadTokens * rates.spend,
};
export default rule;
