import type { CalculatorPlugin } from './types';

const registry = new Map<string, CalculatorPlugin>();

export function registerPlugin(plugin: CalculatorPlugin): void {
  if (registry.has(plugin.meta.id)) {
    console.warn(`插件 "${plugin.meta.id}" 已注册，跳过`);
    return;
  }
  registry.set(plugin.meta.id, plugin);
}

export function getPlugin(id: string): CalculatorPlugin | undefined {
  return registry.get(id);
}

export function getAllPlugins(): CalculatorPlugin[] {
  return Array.from(registry.values());
}

export function hasPlugin(id: string): boolean {
  return registry.has(id);
}
