/**
 * Adzuna API service
 * Fetches job listings and normalizes them into jobsPublic collection
 */
import axios from 'axios';
import JobPublic from '../models/JobPublic.js';

const BASE = process.env.ADZUNA_BASE_URL || 'https://api.adzuna.com/v1/api';
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = 'in'; // India

export async function fetchAdzunaJobs({ keywords = '', location = '', page = 1, results = 20 } = {}) {
  if (!APP_ID || !APP_KEY || APP_ID === 'your_adzuna_app_id') {
    console.warn('⚠️  Adzuna credentials not configured — returning empty public jobs');
    return { results: [], count: 0 };
  }

  try {
    const params = {
      app_id: APP_ID,
      app_key: APP_KEY,
      results_per_page: results,
      what: keywords || 'manager',
      where: location || 'India',
      content_type: 'application/json',
    };

    const url = `${BASE}/jobs/${COUNTRY}/search/${page}`;
    const res = await axios.get(url, { params, timeout: 10000 });
    return { results: res.data.results || [], count: res.data.count || 0 };
  } catch (err) {
    console.error('Adzuna API connection error (using cached fallback):', err.message);
    return { results: [], count: 0 };
  }
}

export async function normalizeAndCache(rawJobs) {
  const ops = rawJobs.map(j => ({
    updateOne: {
      filter: { adzunaId: j.id },
      update: {
        $set: {
          adzunaId: j.id,
          title: j.title,
          company: j.company?.display_name || 'Unknown',
          location: j.location?.display_name || '',
          description: j.description || '',
          url: j.redirect_url || '',
          salary: { min: j.salary_min, max: j.salary_max, currency: 'INR' },
          category: j.category?.label || '',
          industry: j.category?.label || '',
          fetchedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (ops.length > 0) await JobPublic.bulkWrite(ops);
  return ops.length;
}

// Called by cron job — refresh public job cache
export async function refreshPublicJobs() {
  console.log('🔄 Refreshing public jobs from Adzuna...');
  const { results } = await fetchAdzunaJobs({ results: 50 });
  const cached = await normalizeAndCache(results);
  console.log(`✅ Cached ${cached} public jobs`);
}
