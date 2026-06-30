import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  // 1. Fetch event
  const eventsRes = await fetch(`${apiUrl}/pages/events/list`);
  const events = await eventsRes.json();
  const eventId = events.results[0].id;
  
  // 2. Fetch photo
  const photosRes = await fetch(`${apiUrl}/photo/list/${eventId}?page=1`);
  const photos = await photosRes.json();
  const photo = photos.results[0];

  // 3. Create cart
  const cartId = randomUUID();
  
  await fetch(`${apiUrl}/cart/${cartId}/add/photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photo.id })
  });

  // 4. Fetch cart info
  const cartInfoRes = await fetch(`${apiUrl}/cart/${cartId}`);
  const cartInfo = await cartInfoRes.json();

  // 5. Checkout with keys omitted
  const checkoutRes = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: cartId,
      total_value: cartInfo.value,
      customer_document: '99375443353'
    })
  });
  console.log('Status:', checkoutRes.status);
  console.log('Body:', await checkoutRes.text());
}
test();
