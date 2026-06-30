import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  const cartId = randomUUID();
  
  // 1. Fetch event list to get a valid photo ID
  const eventsRes = await fetch(`${apiUrl}/pages/events/list`);
  const events = await eventsRes.json();
  const eventId = events.results[0].id;
  
  const photosRes = await fetch(`${apiUrl}/photo/list/${eventId}?page=1`);
  const photos = await photosRes.json();
  const photoId = photos.results[0].id;

  // 2. Add photo to cart (creates cart)
  await fetch(`${apiUrl}/cart/${cartId}/add/photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photoId })
  });

  // 3. Checkout with ONLY CPF
  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: cartId,
      total_value: 20, // doesn't matter if it's exact for this test?
      customer_document: '99375443353'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
