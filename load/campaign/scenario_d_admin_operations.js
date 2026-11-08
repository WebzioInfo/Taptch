import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20, // 20 concurrent admin operations
  duration: '45s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Fetch Orders List & Financial KPI Overview
  const adminRes = http.get(`${BASE_URL}/api/v1/campaigns/instagram-card/admin`);
  check(adminRes, {
    'admin overview status is 200': (r) => r.status === 200,
    'has kpi metrics': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.success === true && json.data.pnl !== undefined;
      } catch {
        return false;
      }
    },
  });

  // 2. Public Tracking endpoint probe
  const trackRes = http.get(`${BASE_URL}/api/v1/campaigns/instagram-card/orders/track?orderNumber=TAP-NONEXISTENT&phone=9999999999`);
  check(trackRes, {
    'track responds gracefully (404)': (r) => r.status === 404,
  });

  sleep(1);
}

