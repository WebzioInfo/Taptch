import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 50 },  // ramp to 50
    { duration: '1m', target: 200 },  // sustain 200 concurrent customizers
    { duration: '20s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Fetch template configs and materials
  const catalogRes = http.get(`${BASE_URL}/api/v1/campaigns/instagram-card/products`);
  check(catalogRes, {
    'catalog response ok': (r) => r.status === 200,
  });

  // 2. Dynamic price calculation with design option changes
  const diyRes = http.post(
    `${BASE_URL}/api/v1/campaigns/instagram-card/calculate-price`,
    JSON.stringify({
      productId: 'prod_ig_matte_pvc',
      quantity: 2,
      designOption: 'DIY',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(diyRes, {
    'diy calculation ok': (r) => r.status === 200,
  });

  const designerRes = http.post(
    `${BASE_URL}/api/v1/campaigns/instagram-card/calculate-price`,
    JSON.stringify({
      productId: 'prod_ig_metal_steel',
      quantity: 1,
      designOption: 'DESIGNER',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(designerRes, {
    'designer calculation ok': (r) => r.status === 200,
  });

  sleep(0.5);
}

