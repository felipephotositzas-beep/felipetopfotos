import fetch from 'node-fetch';

async function simulate() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  console.log("=== SIMULANDO O FLUXO DO SITE ORIGINAL ===");
  
  // Passo 1: Pegar os asteriscos (O que o site original faz quando o cliente digita o CPF)
  console.log("\n1. Cliente digita o CPF (99375443353) no Checkout...");
  const infoRes = await fetch(`${apiUrl}/customer/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: "99375443353" })
  });
  
  const customerInfo = await infoRes.json();
  console.log("-> Resposta da API:", customerInfo);
  
  // Passo 2: O site original preenche o formulário com os asteriscos e envia pro Checkout
  console.log("\n2. O site original envia os dados com asteriscos para o /checkout...");
  
  // Dummy cart to test the payload format response
  const payload = {
    cart_id: "00000000-0000-0000-0000-000000000000", // dummy cart to force the API to validate fields
    total_value: 10.0,
    customer_document: "99375443353",
    customer_name: customerInfo.customer_name || "Cri***",
    customer_email: customerInfo.customer_email || "c***@live.com",
    customer_phone: customerInfo.customer_phone || "99663"
  };
  
  console.log("-> Payload enviado:", payload);
  
  const checkoutRes = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const checkoutData = await checkoutRes.json();
  console.log("\n3. Resposta da API ao tentar criar o pedido:");
  console.log(checkoutData);
}

simulate();
