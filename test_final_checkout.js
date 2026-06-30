import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  console.log("1. Buscando uma foto válida...");
  const photosRes = await fetch(`${apiUrl}/photo/list/236`);
  const photosData = await photosRes.json();
  const photo = photosData.results[0];
  if (!photo) {
    console.log("Nenhuma foto encontrada no evento 236.");
    return;
  }
  
  const cartId = require('crypto').randomUUID();
  console.log("2. Criando carrinho:", cartId);
  await fetch(`${apiUrl}/cart/${cartId}/add/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photo_id: photo.id,
      modality_id: 2,
      price: 10.00
    })
  });
  
  console.log("3. Enviando APENAS o CPF para o Checkout (conforme solicitado)...");
  const checkoutRes = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: cartId,
      total_value: 10.00,
      customer_document: '08783539336'
    })
  });
  
  console.log("Status HTTP:", checkoutRes.status);
  console.log("Resposta do Servidor:");
  console.log(await checkoutRes.text());
}
test();
