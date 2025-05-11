import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get('desde');
  const token = searchParams.get('token');

  if (!desde || !token) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://colheitacertahb.vercel.app/api/integration/data?desde=${desde}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}