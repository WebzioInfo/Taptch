import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    checkout_burst: {
      executor: 'shared-iterations',
      vus: 50,          // 50 simultaneous concurrent order submissions
      iterations: 50,   // exactly 50 orders
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Checkout p95 < 2s
    http_req_failed: ['rate<0.02'],     // Max 2% failure allowance
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const idempotencyKey = `burst_vu_${vuId}_iter_${iterId}_${Date.now()}`;

  const payload = JSON.stringify({
    productId: 'prod_ig_matte_pvc',
    quantity: 1,
    designOption: 'DIY',
    customerName: `Burst Buyer ${vuId}`,
    customerPhone: `98765${String(10000 + vuId).slice(-5)}`,
    instagramUsername: `burst_buyer_${vuId}`,
    idempotencyKey,
    shippingAddress: {
      recipientName: `Burst Buyer ${vuId}`,
      street: '100 Speed Way',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      phone: `98765${String(10000 + vuId).slice(-5)}`,
    },
  });

  const res = http.post(`${BASE_URL}/api/v1/campaigns/instagram-card/orders`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
  });

  check(res, {
    'order accepted (200)': (r) => r.status === 200,
    'order has orderNumber': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.success === true && json.data.orderNumber !== undefined;
      } catch {
        return false;
      }
    },
  });
}

