import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get('desde');
  const token = searchParams.get('token');

  console.log(`Proxy recebeu requisição com desde=${desde}, token=${token?.substring(0, 5)}...`);

  if (!desde || !token) {
    console.error('Parâmetros obrigatórios não fornecidos');
    return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 });
  }

  try {
    console.log(`Encaminhando requisição para API externa`);
    const response = await fetch(`https://colheitacertahb.vercel.app/api/integration/data?desde=${desde}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Resposta da API externa: ${data.count} contagens`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro no proxy:`, error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}