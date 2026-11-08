import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up to 100 VUs
    { duration: '1m', target: 500 },  // ramp up to 500 VUs (normal campaign traffic)
    { duration: '2m', target: 500 },  // sustain 500 VUs
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Campaign Landing Page
  const landingRes = http.get(`${BASE_URL}/campaigns/instagram-card`);
  check(landingRes, {
    'landing page status is 200': (r) => r.status === 200,
  });

  // 2. Product Catalog API (Cached)
  const catalogRes = http.get(`${BASE_URL}/api/v1/campaigns/instagram-card/products`);
  check(catalogRes, {
    'catalog api status is 200': (r) => r.status === 200,
    'has products': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.success === true && json.data.products.length > 0;
      } catch {
        return false;
      }
    },
  });

  // 3. Price Calculation Probe
  const priceRes = http.post(
    `${BASE_URL}/api/v1/campaigns/instagram-card/calculate-price`,
    JSON.stringify({
      productId: 'prod_ig_matte_pvc',
      quantity: 1,
      designOption: 'DIY',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(priceRes, {
    'price calculation is 200': (r) => r.status === 200,
  });

  sleep(1);
}

