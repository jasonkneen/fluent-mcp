#!/usr/bin/env node

/**
 * Calculator Servlet - Mathematical operations MCP server
 *
 * This servlet provides various mathematical operations including
 * basic arithmetic, statistics, and unit conversions.
 *
 * Usage:
 *   node calculator-servlet.js
 *
 * Tools provided:
 *   - calculate: Evaluate mathematical expressions
 *   - statistics: Calculate statistical measures
 *   - convert: Unit conversions
 */

import { createMCP } from '../../dist/fluent-mcp.js';
import { z } from 'zod';

// Safe math evaluation (basic operations only)
function evaluateExpression(expression) {
  // Remove whitespace and validate characters
  const cleaned = expression.replace(/\s/g, '');

  // Only allow numbers, basic operators, parentheses, and common functions
  if (!/^[\d+\-*/.()%^sqrt|abs|sin|cos|tan|log|pi|e]+$/i.test(cleaned)) {
    throw new Error('Invalid expression: only numbers and basic operators allowed');
  }

  // Replace common math symbols
  let evaluated = cleaned
    .replace(/\^/g, '**')
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/abs\(/gi, 'Math.abs(')
    .replace(/sin\(/gi, 'Math.sin(')
    .replace(/cos\(/gi, 'Math.cos(')
    .replace(/tan\(/gi, 'Math.tan(')
    .replace(/log\(/gi, 'Math.log10(')
    .replace(/pi/gi, 'Math.PI')
    .replace(/e(?![a-z])/gi, 'Math.E');

  try {
    // Use Function constructor for safer evaluation than eval
    const result = new Function(`"use strict"; return (${evaluated})`)();
    return result;
  } catch (e) {
    throw new Error(`Failed to evaluate expression: ${e.message}`);
  }
}

// Unit conversion factors
const conversions = {
  length: {
    m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254, yd: 0.9144
  },
  weight: {
    kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000
  },
  temperature: {
    // Special handling for temperature
  },
  volume: {
    l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588
  }
};

function convertUnits(value, fromUnit, toUnit, category) {
  if (category === 'temperature') {
    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    // Convert to Celsius first, then to target
    let celsius;
    if (from === 'c' || from === 'celsius') {
      celsius = value;
    } else if (from === 'f' || from === 'fahrenheit') {
      celsius = (value - 32) * 5/9;
    } else if (from === 'k' || from === 'kelvin') {
      celsius = value - 273.15;
    } else {
      throw new Error(`Unknown temperature unit: ${fromUnit}`);
    }

    if (to === 'c' || to === 'celsius') {
      return celsius;
    } else if (to === 'f' || to === 'fahrenheit') {
      return celsius * 9/5 + 32;
    } else if (to === 'k' || to === 'kelvin') {
      return celsius + 273.15;
    } else {
      throw new Error(`Unknown temperature unit: ${toUnit}`);
    }
  }

  const categoryConversions = conversions[category];
  if (!categoryConversions) {
    throw new Error(`Unknown category: ${category}`);
  }

  const fromFactor = categoryConversions[fromUnit.toLowerCase()];
  const toFactor = categoryConversions[toUnit.toLowerCase()];

  if (!fromFactor || !toFactor) {
    throw new Error(`Unknown unit in category ${category}`);
  }

  // Convert to base unit, then to target
  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}

createMCP('calculator-servlet', '1.0.0')
  // Evaluate mathematical expression
  .tool(
    'calculate',
    {
      expression: z.string().describe('Mathematical expression (e.g., "2 + 2", "sqrt(16)", "sin(pi/2)")'),
    },
    async ({ expression }) => {
      try {
        const result = evaluateExpression(expression);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              expression,
              result: Number.isInteger(result) ? result : Number(result.toFixed(10)),
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              expression,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Calculate statistics
  .tool(
    'statistics',
    {
      numbers: z.array(z.number()).describe('Array of numbers to analyze'),
      operations: z.array(z.enum(['mean', 'median', 'mode', 'stddev', 'min', 'max', 'sum', 'count']))
        .optional()
        .describe('Statistics to calculate (default: all)'),
    },
    async ({ numbers, operations }) => {
      if (numbers.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: 'Empty array provided' }, null, 2)
          }]
        };
      }

      const sorted = [...numbers].sort((a, b) => a - b);
      const sum = numbers.reduce((a, b) => a + b, 0);
      const mean = sum / numbers.length;

      // Calculate median
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      // Calculate mode
      const frequency = {};
      numbers.forEach(n => frequency[n] = (frequency[n] || 0) + 1);
      const maxFreq = Math.max(...Object.values(frequency));
      const mode = Object.keys(frequency)
        .filter(k => frequency[k] === maxFreq)
        .map(Number);

      // Calculate standard deviation
      const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
      const stddev = Math.sqrt(avgSquareDiff);

      const allStats = {
        count: numbers.length,
        sum,
        mean,
        median,
        mode: mode.length === numbers.length ? null : mode,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        stddev,
        range: sorted[sorted.length - 1] - sorted[0],
      };

      // Filter to requested operations if specified
      const ops = operations || Object.keys(allStats);
      const result = {};
      ops.forEach(op => {
        if (allStats.hasOwnProperty(op)) {
          result[op] = allStats[op];
        }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, data: result }, null, 2)
        }]
      };
    }
  )

  // Unit conversion
  .tool(
    'convert',
    {
      value: z.number().describe('Value to convert'),
      from: z.string().describe('Source unit (e.g., "km", "lb", "C")'),
      to: z.string().describe('Target unit (e.g., "mi", "kg", "F")'),
      category: z.enum(['length', 'weight', 'temperature', 'volume'])
        .describe('Unit category'),
    },
    async ({ value, from, to, category }) => {
      try {
        const result = convertUnits(value, from, to, category);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              conversion: {
                from: { value, unit: from },
                to: { value: Number(result.toFixed(6)), unit: to },
                category,
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  .stdio()
  .start()
  .catch((err) => {
    console.error('Calculator servlet failed to start:', err);
    process.exit(1);
  });
