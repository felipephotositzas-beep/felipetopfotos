import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  const cartId = randomUUID();
  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: cartId,
      total_value: 10.00,
      customer_document: '08783539336'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
