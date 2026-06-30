import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  // 1. Fetch an event or something to create a cart
  // We just need any valid photo ID. Let's list photos.
  const photosRes = await fetch(`${apiUrl}/photo/list/test`);
  // Not sure the endpoint. Let's just check the response of /api/order/checkout with invalid data.
  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: 'fake-cart',
      total_value: 10.00,
      customer_document: '08783539336'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
