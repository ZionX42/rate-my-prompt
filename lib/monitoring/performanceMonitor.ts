import 'server-only';

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  /**
   * Start a performance measurement
   */
  static startMeasurement(name: string): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    performance.mark(`${id}_start`);
    return id;
  }

  /**
   * End a performance measurement and record the duration
   */
  static endMeasurement(id: string): number {
    const name = id.split('_')[0];
    performance.mark(`${id}_end`);

    try {
      performance.measure(id, `${id}_start`, `${id}_end`);
      const measure = performance.getEntriesByName(id)[0];
      const duration = measure.duration;

      // Store measurement
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);

      // Keep only last 100 measurements per name
      const measurements = this.measurements.get(name)!;
      if (measurements.length > 100) {
        measurements.shift();
      }

      // Clean up performance marks
      performance.clearMarks(`${id}_start`);
      performance.clearMarks(`${id}_end`);
      performance.clearMeasures(id);

      return duration;
    } catch (error) {
      console.error('Performance measurement failed:', error);
      return 0;
    }
  }

  /**
   * Measure execution time of an async function
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      // Store measurement
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);

      return { result, duration };
    } catch (error) {
      const _duration = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(name?: string): Record<string, unknown> {
    if (name) {
      const measurements = this.measurements.get(name) || [];
      if (measurements.length === 0) {
        return { name, count: 0 };
      }

      const sorted = [...measurements].sort((a, b) => a - b);
      return {
        name,
        count: measurements.length,
        avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    // Return stats for all measurements
    const stats: Record<string, unknown> = {};
    this.measurements.forEach((measurements, measurementName) => {
      stats[measurementName] = this.getStats(measurementName);
    });
    return stats;
  }

  /**
   * Clear all measurements
   */
  static clearMeasurements(name?: string) {
    if (name) {
      this.measurements.delete(name);
    } else {
      this.measurements.clear();
    }
  }

  /**
   * Create a performance timer decorator
   */
  static timer(name: string) {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        return PerformanceMonitor.measureAsync(`${name}.${propertyKey}`, () =>
          originalMethod.apply(this, args)
        );
      };

      return descriptor;
    };
  }
}
