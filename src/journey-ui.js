import {expeditionRules} from './rules.js';

// Derive goals from completed steps, so a resumed or paused fight stays accurate.
export function journeyGoals(run) {
  if (run.direction === 'return') return [{step: run.returnTotal, left: run.returnLeft, label: '平安返城'}];
  const goals = new Map();
  const add = (step, label) => {
    if (step <= run.cleared || step > expeditionRules.end) return;
    const labels = goals.get(step) || [];
    if (!labels.includes(label)) labels.push(label);
    goals.set(step, labels);
  };
  add((Math.floor(run.cleared / 5) + 1) * 5, '首领');
  if (run.target > run.cleared) add(run.target, '整顿');
  for (const step of expeditionRules.checkpoints) add(step, '免费回城');
  add(expeditionRules.storyAt, '引路人');
  add(expeditionRules.end, '终点抽卡');
  const speedStep = (Math.floor((run.totalForward || 0) / 30) + 1) * 30;
  if (1 + Math.floor((run.totalForward || 0) / 30) < expeditionRules.maxSpeed) {
    add(run.cleared + speedStep - (run.totalForward || 0), '战速 +1×');
  }
  return [...goals].sort(([a], [b]) => a - b).slice(0, 3)
    .map(([step, labels]) => ({step, left: step - run.cleared, label: labels.join(' · ')}));
}

export function tenStepProgress(run) {
  const plan = run.plan;
  if (run.direction !== 'outbound' || !plan || plan.count !== 10 || plan.target - plan.start !== 10 || run.cleared >= plan.target) return null;
  return {done: run.cleared - plan.start, total: 10};
}
