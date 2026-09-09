-- Marca do banco na conta, para o app mostrar nome, cor e ícone certos
-- quando o extrato ou a fatura é importado.
alter table public.contas add column if not exists banco text not null default '';

-- Cartão de crédito: dia em que a fatura fecha e dia em que ela vence.
alter table public.contas add column if not exists fechamento smallint not null default 0;
alter table public.contas add column if not exists vencimento smallint not null default 0;

-- O que a pessoa ensina na importação ("esse nome é Combustível") vale nas
-- próximas: nome de origem -> categoria.
alter table public.perfis add column if not exists regras_categoria jsonb not null default '{}'::jsonb;

-- Pares de lançamentos que a pessoa disse que NÃO são transferência entre
-- contas, para o app não perguntar de novo.
alter table public.perfis add column if not exists pares_ignorados jsonb not null default '[]'::jsonb;

-- De qual importação de extrato o lançamento veio, para dar para tirar a
-- leva inteira quando a leitura do arquivo sai errada.
alter table public.lancamentos add column if not exists importacao_id text not null default '';

-- Registro das importações: arquivo, banco, quantos lançamentos e o saldo
-- que o extrato mostrava no fim.
alter table public.perfis add column if not exists importacoes jsonb not null default '[]'::jsonb;

-- Endereço do cliente, para o botão de rota abrir o Maps ou o Waze.
alter table public.clientes add column if not exists endereco text not null default '';

-- Orçamentos (simular serviço): material, mão de obra, logística e validade.
alter table public.perfis add column if not exists propostas jsonb not null default '[]'::jsonb;

-- Quem assina o orçamento no PDF.
alter table public.perfis add column if not exists negocio text not null default '';
alter table public.perfis add column if not exists contato text not null default '';
