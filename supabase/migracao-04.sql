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
