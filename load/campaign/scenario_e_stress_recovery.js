import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 200 },  // baseline
    { duration: '1m', target: 700 },   // heavy stress beyond 500 VUs
    { duration: '30s', target: 1000 }, // peak breaking point stress
    { duration: '1m', target: 200 },   // recover back to baseline
    { duration: '30s', target: 0 },    // cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<2500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/campaigns/instagram-card/products`);
  check(res, {
    'catalog responds': (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.2);
}

