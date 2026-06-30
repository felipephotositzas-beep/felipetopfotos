import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';

  console.log("=== SIMULANDO POSTMAN: POST /api/customer/info ===");
  const res = await fetch(`${apiUrl}/customer/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_document: '08783533936' // O CPF da print
    })
  });
  
  console.log('Status HTTP:', res.status);
  console.log('Resposta do Servidor:');
  console.log(await res.json());
}
test();
