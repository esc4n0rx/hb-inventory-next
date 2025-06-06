import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContagensPage from './page'; // Adjust path as needed
import { useInventarioStore } from '@/lib/store'; // Mocked
import { toast } from 'sonner'; // Mocked
import { lojas } from '@/data/lojas'; // Mocked
import { setoresCD } from '@/data/setores'; // Mocked
import { ativos } from '@/data/ativos'; // Mocked
import { fornecedores } from '@/data/fornecedores'; // Mocked

// Mock dependencies
jest.mock('@/lib/store', () => ({
  useInventarioStore: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock data (provide minimal structure)
jest.mock('@/data/lojas', () => ({ lojas: { 'Sudeste': ['CD SP', 'CD ES', 'Loja X'] } }));
jest.mock('@/data/setores', () => ({ setoresCD: ['Setor A', 'Setor B'] }));
jest.mock('@/data/ativos', () => ({ ativos: ['Ativo 1', 'Ativo 2', 'Ativo Transito'] }));
jest.mock('@/data/fornecedores', () => ({ fornecedores: [{ nome: 'Fornecedor Y' }] }));


const mockAdicionarContagem = jest.fn();
const mockEditarContagem = jest.fn();
const mockCarregarContagens = jest.fn();
const mockAtualizarProgressoInventario = jest.fn();

const defaultStoreState = {
  inventarioAtual: { id: 'inv1', status: 'ativo', codigo: 'INV001', data_inicio: new Date().toISOString(), responsavel: 'Test User', progresso: { lojas: 0, setores: 0, fornecedores: 0 } },
  contagens: [],
  isLoading: false,
  adicionarContagem: mockAdicionarContagem,
  editarContagem: mockEditarContagem,
  removerContagem: jest.fn(),
  carregarContagens: mockCarregarContagens,
  atualizarProgressoInventario: mockAtualizarProgressoInventario,
  getEstatisticas: jest.fn(() => ({ totalLojasContadas: 0, totalSetoresContados: 0, lojasPendentes: {}, progresso: { lojas: 0, setores: 0, fornecedores: 0 }})),
};

describe('ContagensPage Dialog - Transit Form Conditional Rendering', () => {
  beforeEach(() => {
    // Reset mocks and store state for each test
    jest.clearAllMocks();
    (useInventarioStore as jest.Mock).mockReturnValue(defaultStoreState);
    render(<ContagensPage />);
    // Open the dialog to make the form visible
    const novaContagemButton = screen.getByRole('button', { name: /nova contagem/i });
    fireEvent.click(novaContagemButton);
  });

  const getLabelForInput = (labelText: string) => {
    // Helper to find inputs by their associated label text
    const label = screen.getByText(labelText);
    const inputId = label.getAttribute('for');
    if (!inputId) throw new Error(`Label for "${labelText}" does not have a 'for' attribute.`);
    return screen.getByTestId(inputId) || screen.getByLabelText(labelText) || screen.getByRole('combobox', { name: labelText }) || screen.getByRole('textbox', { name: labelText }) || screen.getByRole('spinbutton', { name: labelText });
  }

  const getSelectTriggerByLabel = (labelText: string) => {
    // For custom Select components that might not directly link label via 'for'
    // This is a simplified approach; real-world might need more robust selectors
    const labelElement = screen.getByText(labelText);
    // Assuming the SelectTrigger is the next focusable element or identifiable sibling/parent relation.
    // This is a common pattern but might need adjustment based on actual DOM structure.
    // For this example, we'll assume a specific structure or use a more direct selector if possible.
    // A more robust way would be to ensure your <SelectTrigger> has an aria-label or is findable via its content.
    // Let's assume SelectTrigger has `id` matching label's `htmlFor` or is findable by role.
    const inputId = labelElement.getAttribute('for');
    if (inputId) return screen.getByTestId(inputId); // if you add data-testid to SelectTrigger
    // Fallback: try to find by role, but this might be too generic
    // This is a placeholder for a more robust selector strategy for custom select components.
    // For now, we assume the form fields are standard inputs or have accessible labels.
    return screen.getByRole('combobox', { name: new RegExp(labelText, "i")});
  };


  test('should NOT display transit fields when tipo is "setor"', async () => {
    // Select "Setor do CD" as type
    const tipoSelect = screen.getByRole('combobox', { name: /Tipo/i });
    fireEvent.change(tipoSelect, { target: { value: 'setor' } }); // This is for HTML select. For Radix, need to click and select item.
    // For Radix:
    // fireEvent.click(tipoSelect);
    // await screen.findByText('Setor do CD'); // Wait for items to appear
    // fireEvent.click(screen.getByText('Setor do CD'));


    // Assert transit fields are not present
    expect(screen.queryByLabelText(/Ativo Trânsito/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Qtd. Trânsito/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Resp. Trânsito/i)).not.toBeInTheDocument();
  });

  test('should NOT display transit fields when tipo is "loja" and origem is NOT "CD SP" or "CD ES"', async () => {
    const tipoSelect = screen.getByRole('combobox', { name: /Tipo/i });
    // Default is "Loja", so no need to change tipo if it's already "Loja"
    // fireEvent.click(tipoSelect);
    // await screen.findByText('Loja');
    // fireEvent.click(screen.getByText('Loja'));

    // Select "Loja X" as origem
    const origemSelect = screen.getByRole('combobox', {name: /Loja/i}); // It becomes "Loja"
    fireEvent.click(origemSelect);
    await screen.findByText('Loja X');
    fireEvent.click(screen.getByText('Loja X'));

    expect(screen.queryByLabelText(/Ativo Trânsito/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Qtd. Trânsito/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Resp. Trânsito/i)).not.toBeInTheDocument();
  });

  test('SHOULD display transit fields when tipo is "loja" and origem is "CD SP"', async () => {
    const tipoSelect = screen.getByRole('combobox', { name: /Tipo/i });
    // Default is "Loja"

    const origemSelect = screen.getByRole('combobox', {name: /Loja/i});
    fireEvent.click(origemSelect);
    await screen.findByText('CD SP');
    fireEvent.click(screen.getByText('CD SP'));

    expect(screen.getByLabelText(/Ativo Trânsito/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Qtd. Trânsito/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resp. Trânsito/i)).toBeInTheDocument();
  });

  test('SHOULD display transit fields when tipo is "loja" and origem is "CD ES"', async () => {
    const tipoSelect = screen.getByRole('combobox', { name: /Tipo/i });
    // Default is "Loja"

    const origemSelect = screen.getByRole('combobox', {name: /Loja/i});
    fireEvent.click(origemSelect);
    await screen.findByText('CD ES');
    fireEvent.click(screen.getByText('CD ES'));

    expect(screen.getByLabelText(/Ativo Trânsito/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Qtd. Trânsito/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resp. Trânsito/i)).toBeInTheDocument();
  });

  test('transit fields should allow input when visible', async () => {
    const origemSelect = screen.getByRole('combobox', {name: /Loja/i}); // Label changes based on tipo
    fireEvent.click(origemSelect);
    await screen.findByText('CD SP');
    fireEvent.click(screen.getByText('CD SP'));

    // Interact with transit fields
    const ativoTransitoSelect = screen.getByLabelText(/Ativo Trânsito/i);
    fireEvent.click(ativoTransitoSelect);
    await screen.findByText('Ativo Transito'); // Assuming 'Ativo Transito' is a valid option from mocked data
    fireEvent.click(screen.getByText('Ativo Transito'));
    // Check if the select has the new value. This depends on Radix Select implementation details.
    // For a native select, you'd check `expect(ativoTransitoSelect.value).toBe('Ativo Transito');`
    // For Radix, often the displayed value is within the trigger.
    expect(screen.getByRole('combobox', {name: /Ativo Trânsito/i})).toHaveTextContent('Ativo Transito');


    const qtdTransitoInput = screen.getByLabelText(/Qtd. Trânsito/i);
    fireEvent.change(qtdTransitoInput, { target: { value: '123' } });
    expect(qtdTransitoInput).toHaveValue(123);

    const respTransitoInput = screen.getByLabelText(/Resp. Trânsito/i);
    fireEvent.change(respTransitoInput, { target: { value: 'Responsavel Teste' } });
    expect(respTransitoInput).toHaveValue('Responsavel Teste');
  });
});

describe('ContagensPage Dialog - Form Submission Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useInventarioStore as jest.Mock).mockReturnValue(defaultStoreState);
    render(<ContagensPage />);
    const novaContagemButton = screen.getByRole('button', { name: /nova contagem/i });
    fireEvent.click(novaContagemButton);
  });

  const fillAndSubmitForm = async (data: {
    tipo?: string;
    origem: string;
    ativo: string;
    quantidade: string;
    responsavel: string;
    transito_ativo?: string;
    transito_quantidade?: string;
    transito_responsavel?: string;
    submit: boolean;
  }) => {
    // Select Tipo if specified (default is Loja)
    if (data.tipo) {
      const tipoSelect = screen.getByRole('combobox', { name: /Tipo/i });
      fireEvent.click(tipoSelect);
      // Radix Select: find by role after click
      const option = await screen.findByRole('option', { name: new RegExp(data.tipo, 'i') });
      fireEvent.click(option);
    }

    // Determine label for origem based on current tipo
    const currentTipo = data.tipo || defaultStoreState.inventarioAtual?.status === 'ativo' ? (useInventarioStore() as any).formData?.tipo || 'loja' : 'loja';
    const origemLabel = currentTipo === 'loja' ? /Loja/i : currentTipo === 'setor' ? /Setor/i : /Fornecedor/i;
    const origemSelect = screen.getByRole('combobox', { name: origemLabel });
    fireEvent.click(origemSelect);
    const origemOption = await screen.findByRole('option', { name: data.origem });
    fireEvent.click(origemOption);


    const ativoSelect = screen.getByRole('combobox', { name: /Ativo/i });
    fireEvent.click(ativoSelect);
    const ativoOption = await screen.findByRole('option', { name: data.ativo });
    fireEvent.click(ativoOption);

    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: data.quantidade } });
    fireEvent.change(screen.getByLabelText(/Responsável/i), { target: { value: data.responsavel } });

    if (data.transito_ativo) {
      // Wait for transit fields to potentially appear
      const ativoTransitoSelect = await screen.findByRole('combobox', { name: /Ativo Trânsito/i });
      fireEvent.click(ativoTransitoSelect);
      const ativoTransitoOption = await screen.findByRole('option', { name: data.transito_ativo });
      fireEvent.click(ativoTransitoOption);
    }
    if (data.transito_quantidade) {
      fireEvent.change(await screen.findByLabelText(/Qtd. Trânsito/i), { target: { value: data.transito_quantidade } });
    }
    if (data.transito_responsavel) {
      fireEvent.change(await screen.findByLabelText(/Resp. Trânsito/i), { target: { value: data.transito_responsavel } });
    }

    if (data.submit) {
        const submitButton = screen.getByRole('button', { name: /Adicionar Contagem/i });
        fireEvent.click(submitButton);
    }
  };

  test('submitting for "CD SP" with transit data should call adicionarContagem with all fields', async () => {
    await fillAndSubmitForm({
      origem: 'CD SP', // This will make transit fields appear
      ativo: 'Ativo 1',
      quantidade: '10',
      responsavel: 'Test User',
      transito_ativo: 'Ativo Transito',
      transito_quantidade: '5',
      transito_responsavel: 'Transit Resp',
      submit: true,
    });

    await waitFor(() => {
      expect(mockAdicionarContagem).toHaveBeenCalledTimes(1);
      expect(mockAdicionarContagem).toHaveBeenCalledWith(
        expect.objectContaining({
          inventarioId: defaultStoreState.inventarioAtual?.id,
          tipo: 'loja', // Default
          origem: 'CD SP',
          ativo: 'Ativo 1',
          quantidade: 10,
          responsavel: 'Test User',
          transito_ativo: 'Ativo Transito',
          transito_quantidade: 5,
          transito_responsavel: 'Transit Resp',
        })
      );
    });
  });

  test('submitting for "Loja X" (non-CD) should call adicionarContagem without transit fields', async () => {
    await fillAndSubmitForm({
      origem: 'Loja X', // Transit fields should not appear or be submitted
      ativo: 'Ativo 2',
      quantidade: '20',
      responsavel: 'Another User',
      submit: true,
    });

    await waitFor(() => {
      expect(mockAdicionarContagem).toHaveBeenCalledTimes(1);
      const calledWith = mockAdicionarContagem.mock.calls[0][0];
      expect(calledWith).toEqual(
        expect.objectContaining({
          inventarioId: defaultStoreState.inventarioAtual?.id,
          tipo: 'loja',
          origem: 'Loja X',
          ativo: 'Ativo 2',
          quantidade: 20,
          responsavel: 'Another User',
        })
      );
      expect(calledWith.transito_ativo).toBeUndefined();
      expect(calledWith.transito_quantidade).toBeUndefined();
      expect(calledWith.transito_responsavel).toBeUndefined();
    });
  });

  test('submitting for "CD SP" but empty transit_ativo should call adicionarContagem without transit fields', async () => {
    // Here, transit fields will be visible, but we are not filling transito_ativo
    // The handleSubmit logic should then strip them.
    await fillAndSubmitForm({
      origem: 'CD SP',
      ativo: 'Ativo 1',
      quantidade: '15',
      responsavel: 'User C',
      // transito_ativo is deliberately omitted or empty
      transito_quantidade: '3', // This might be filled by user but should be ignored
      transito_responsavel: 'Resp C', // This might be filled by user but should be ignored
      submit: true,
    });

    await waitFor(() => {
      expect(mockAdicionarContagem).toHaveBeenCalledTimes(1);
      const calledWith = mockAdicionarContagem.mock.calls[0][0];
      expect(calledWith).toEqual(
        expect.objectContaining({
          inventarioId: defaultStoreState.inventarioAtual?.id,
          tipo: 'loja',
          origem: 'CD SP',
          ativo: 'Ativo 1',
          quantidade: 15,
          responsavel: 'User C',
        })
      );
      expect(calledWith.transito_ativo).toBeUndefined();
      expect(calledWith.transito_quantidade).toBeUndefined();
      expect(calledWith.transito_responsavel).toBeUndefined();
    });
  });
});
