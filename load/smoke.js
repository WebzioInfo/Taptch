import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<150'], // 95% of requests must complete below 150ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Health Probe
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    'health returns valid json': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  // 2. Readiness Probe
  const readyRes = http.get(`${BASE_URL}/api/ready`);
  check(readyRes, {
    'ready status is 200': (r) => r.status === 200,
  });

  // 3. Root Landing Page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'home status is 200': (r) => r.status === 200,
  });

  // 4. Design System Studio
  const galleryRes = http.get(`${BASE_URL}/dev/gallery`);
  check(galleryRes, {
    'gallery status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

