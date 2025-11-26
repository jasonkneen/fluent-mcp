#!/usr/bin/env node

/**
 * Weather Servlet - A simple weather information MCP server
 *
 * This servlet demonstrates how to create a weather-focused MCP server
 * with simulated weather data. In production, you would connect to a
 * real weather API like OpenWeatherMap, WeatherAPI, etc.
 *
 * Usage:
 *   node weather-servlet.js
 *
 * Tools provided:
 *   - getCurrentWeather: Get current weather for a location
 *   - getForecast: Get 5-day weather forecast
 *   - getAlerts: Get weather alerts for a region
 */

import { createMCP } from '../../dist/fluent-mcp.js';
import { z } from 'zod';

// Simulated weather data (in production, use a real API)
const weatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'stormy'];
const alerts = [
  { type: 'heat', message: 'Heat advisory in effect', severity: 'moderate' },
  { type: 'storm', message: 'Thunderstorm warning', severity: 'severe' },
  { type: 'wind', message: 'High wind warning', severity: 'moderate' },
];

function generateWeather(location) {
  const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const temp = Math.floor(Math.random() * 35) + 5; // 5-40°C
  const humidity = Math.floor(Math.random() * 60) + 40; // 40-100%
  const windSpeed = Math.floor(Math.random() * 50) + 5; // 5-55 km/h

  return {
    location,
    condition,
    temperature: { celsius: temp, fahrenheit: Math.round(temp * 9/5 + 32) },
    humidity,
    windSpeed,
    timestamp: new Date().toISOString(),
  };
}

function generateForecast(location, days) {
  const forecast = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString().split('T')[0],
      ...generateWeather(location),
    });
  }

  return forecast;
}

createMCP('weather-servlet', '1.0.0')
  // Get current weather
  .tool(
    'getCurrentWeather',
    {
      location: z.string().describe('City name or location (e.g., "London", "New York, NY")'),
      units: z.enum(['metric', 'imperial']).optional().describe('Temperature units (default: metric)'),
    },
    async ({ location, units = 'metric' }) => {
      const weather = generateWeather(location);

      const displayTemp = units === 'imperial'
        ? `${weather.temperature.fahrenheit}°F`
        : `${weather.temperature.celsius}°C`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              location: weather.location,
              condition: weather.condition,
              temperature: displayTemp,
              humidity: `${weather.humidity}%`,
              windSpeed: `${weather.windSpeed} km/h`,
              timestamp: weather.timestamp,
            }
          }, null, 2)
        }]
      };
    }
  )

  // Get weather forecast
  .tool(
    'getForecast',
    {
      location: z.string().describe('City name or location'),
      days: z.number().min(1).max(7).optional().describe('Number of days (1-7, default: 5)'),
    },
    async ({ location, days = 5 }) => {
      const forecast = generateForecast(location, days);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              location,
              days: forecast.length,
              forecast: forecast.map(f => ({
                date: f.date,
                condition: f.condition,
                high: `${f.temperature.celsius}°C`,
                humidity: `${f.humidity}%`,
              }))
            }
          }, null, 2)
        }]
      };
    }
  )

  // Get weather alerts
  .tool(
    'getAlerts',
    {
      region: z.string().describe('Region or country code'),
    },
    async ({ region }) => {
      // Randomly decide if there are alerts (50% chance)
      const hasAlerts = Math.random() > 0.5;
      const activeAlerts = hasAlerts
        ? [alerts[Math.floor(Math.random() * alerts.length)]]
        : [];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              region,
              alertCount: activeAlerts.length,
              alerts: activeAlerts,
              lastUpdated: new Date().toISOString(),
            }
          }, null, 2)
        }]
      };
    }
  )

  .stdio()
  .start()
  .catch((err) => {
    console.error('Weather servlet failed to start:', err);
    process.exit(1);
  });
