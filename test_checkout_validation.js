import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  const cartId = randomUUID();

  // Test 1: Omitting keys
  const res1 = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: cartId,
      total_value: 10.00,
      customer_document: '99375443353'
    })
  });
  console.log('Test 1 (Omit keys) Status:', res1.status);
  console.log('Test 1 Body:', await res1.text());

  // Test 2: Empty strings
  const res2 = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: cartId,
      total_value: 10.00,
      customer_document: '99375443353',
      customer_name: '',
      customer_email: '',
      customer_phone: ''
    })
  });
  console.log('Test 2 (Empty strings) Status:', res2.status);
  console.log('Test 2 Body:', await res2.text());
}
test();
